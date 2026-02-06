---
title: "MySQL's RANK() function"
publicationDate: 2026-01-24
description: "I really considered writing a rhyming title for this one."
---

<a title='Danish: "Once a long time ago..."'>Engang for længe siden...</a> I tried fairly hard to optimise an old, *highly* slow, database-based ranking system.
Hopefully a little bit of this is interesting.

## What & why?
The context is immaterial; what matters is what I started with.

Two database tables:
```sql
CREATE TABLE `scores` (
  `account` int unsigned NOT NULL,
  `board` tinyint unsigned NOT NULL,
  `value` decimal(9,2) NOT NULL DEFAULT '0.00',
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `account_value` (`account`,`board`)
) ENGINE=InnoDB;

CREATE TABLE `ranks` (
  `account` int unsigned NOT NULL,
  `board` tinyint unsigned NOT NULL,
  `rank` mediumint unsigned DEFAULT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `group` int unsigned DEFAULT NULL,
  `group_rank` smallint unsigned DEFAULT NULL,
  UNIQUE KEY `account_rank` (`account`,`board`)
) ENGINE=InnoDB;
```

These tables are reasonably large. At the time of writing this, we have ~320,000 accounts and 89 different leaderboards,
for a total of ~28.5 million entries in each table. (Everyone gets ranked globally and then in *one* group. No dual-group-membership.)
Granted, this isn't huge in an actual space-usage sense: only ~3GiB per table. But doing 89x320,000 rankings is pretty heavy for one core
of a Ryzen 5600x.

My task was to improve the process of generating the second table -- the one with the rankings in it --
from the first table -- the one with the scores in it.
Importantly, the `scores` table is *very* frequently used, which is what caused me to need to look into this in the first
place. The process of regenerating the `ranks` was holding the `scores` table lock for too long, causing timeouts and other nasties.

## Getting Started
At the beginning of my investigation, we had a script that executed a lot of small queries.
Initially one-per-score, using the old temporary-variable trick to rank them. The first query looked like this:
```sql
INSERT INTO ranks (`board`, `account`, `rank`, `date`) (
    SELECT `board`, `account`, `rank`, CURRENT_TIMESTAMP
    FROM (
        SELECT `board`, `account`, @rank:=@rank+1 AS `rank`
        FROM `scores`, (SELECT @rank:=0) tmp
        WHERE board=? /* Query parameter: which board are we ranking? */
        ORDER BY `value` DESC,`account` ASC
    ) tmp
    LEFT JOIN `ranks` ON (
        tmp.`account`=ranks.`account` AND tmp.`board`=ranks.`board`
    )
    WHERE (
        tmp.`rank` != ranks.`rank` OR ranks.`rank` IS NULL
    )
) ON DUPLICATE KEY UPDATE
    `rank`=values(`rank`),`date`=values(`date`);
```

Yeah, "small queries"... nice. Anyway, this was selecting-and-reinserting into the `ranks` table based on a
sorted selection from the scores table, with a temporary variable `@rank` to keep track of everyone's position in the
sort. The join & where is there to minimise the amount of re-*writing* we have to do back to the `ranks` table, by only
writing when a rank changes.

This query gets run 89 times, once for every rank, and then the group ranks get computed based on selecting out of the
global rank. (Hence why none of that appears in this query.) This process was even more complicated, and based on a
threshold value for the size of the group. It also used a third table for group membership, but we'll get to that later.

And yep, even split into 89 pieces, some of these pieces were taking more than 2m30s, and thereby causing
updates to the `scores` table to start timing out. In total, the whole thing (running this query 89 times, then running the
smaller group-rank queries as many times as needed) took about 40 minutes, with wild variability between different
leaderboards that we never really figured out.

## Discovering Options
When I started looking at this, I quickly discovered that since this code was first written, MySQL gained a `RANK()`
function (oooh, aaah). Moreover, `RANK()` lets you partition *while you rank*, which means we can generate ranks
per-leaderboard *and* per-group all in one go! This turns out to be substantially faster, presumably because MySQL can
keep bits of data (like the account identifiers and their associated index) close-at-hand for the entire runtime.

This took the whole thing from 89 (+more) queries down to just one:
```sql
INSERT INTO `ranks` (`account`, `board`, `date`, `rank`, `group_id`, `group_rank`)
    SELECT s.`account`,s.`board`,(
        RANK() OVER (
            PARTITION BY s.`board`
            ORDER BY s.`value` DESC,s.`account` ASC
        )
    ),CURRENT_TIMESTAMP,g.`group_id`,(
        RANK() OVER (
            PARTITION BY s.`board`,g.`group_id`
            ORDER BY s.`value` DESC,s.`account` ASC
        )
    )
    FROM `scores` s
    LEFT JOIN group_membership g ON s.`account`=g.`account`
) ON DUPLICATE KEY UPDATE
    `rank`=values(`rank`),`date`=CURRENT_TIMESTAMP,
    `group_id`=values(`group_id`),`group_rank`=values(`group_rank`);
```

This sped us up a lot. Like, a *lot*. The runtime of this query is ~12 minutes, down from ~40 minutes under the old approach.
However, this is one stonkingly big query, which means we're still plagued by the locking issue: if we run this as-is, we've
locked the `scores` table for 12 minutes, which actually makes our original 2m30s timeout problem *worse*.

Also the inner SELECT here only takes like, 2 minutes. Wild. But writing is always harder than reading so I guess that's kinda
fair enough.

However, it turns out that a big reason why this takes 12 mintues is that MySQL has an *undo log*, which is how it handles
transaction-level consistency. It keeps a record of all rows changed during a transaction so it can roll them all back if
something fails. In doing this query, then, we've caused ~28.5 million entries to be written to the undo log, which is where
most of the 12 minutes goes.

## Ways Forward
### One
Try some lock business with a temporary table. By which, this means:
```sql
DROP TABLE IF EXISTS ranks_new;
DROP TABLE IF EXISTS ranks_old;

CREATE TABLE ranks_new LIKE ranks;
SET TRANSATION ISOLATION LEVEL READ UNCOMMITTED;

...

RENAME ranks TO ranks_old, ranks_new TO ranks;
COMMIT;
DROP TABLE ranks_old;
```

Clean up cruft just-in-case, duplicate the `ranks` table, then *without* read-locking the `scores` table, dump data into the
new table. So the only lock we have is the lock on the new table, which no-one else should be looking at.
Then, perform what I'm referring to as "Indiana Jones'ing" the tables<sup>[[1](https://www.youtube.com/watch?v=mC1ikwQ5Zgc)]</sup>
by atomically renaming them. Then commit everything and get rid of the old stuff.

So the ~12 minute big query runs in the background, reading-without-locking from `scores` and writing-with-locking into a new table
that no-one cares about. If a table locks in a ~~forest~~ database, but no-one tries to use it... does it really lock?

### Two
Try dumping the new to file with `SELECT INTO outfile;` and then loading it with `LOAD DATA infile;`, instead of
<a title="INSERT ... ON DUPLICATE KEY UPDATE">IODKU</a>. I saw some sources claiming this could be faster in some cases, it
just requires managing a temporary file on your DB server somehow (which is not super fun).

Well, turns out this actually ended up taking *longer*: ~15 minutes, up from 12. So we canned this idea, because trying to manage remotely
creating and deleting some `outfile` on our DB server with only a MySQL interface sucks even it ran at the same speed.
At a guess, the slowdown was probably because writing to file means the data is just going to disk and getting re-read, rather than
remaining inside MySQL's memory. Maybe it's better for truly huge tables that just never fit in memory to begin with?

### Three
Try `CREATE TABLE SELECT`. This one I had high hopes for. The reason being, when we do IODKU, we already have a table, but MySQL doesn't
"know" the contents of at `INSERT`-time.
This means it has to create an undo log entry for every single row (to roll it back to "this row doesn't exist").
Now, of course, you and I who are writing this can tell that the table was empty to begin with, and so the undo log *really* only
needs to say "this table was empty", but with a separate `CREATE` and `INSERT`, MySQL doesn't know the difference.

So in *theeeoooory*, `CREATE TABLE SELECT` should correctly indicate to MySQL that the table was empty to begin with, which avoids all
of that undo-log-writing. In *practice*, however... you can't `CREATE TABLE ranks_new SELECT ... LIKE ranks`. So you have to
completely blow out the complexity of your query by manually naming everything correctly, and even have to put in special care to make
sure your indices get rebuilt in the same way once the table is created. So, because something something readable something something
maintainable, this option isn't really suitable either.

### Four
Mmmmm... maybe we could split things back up again?
So go back to 89 queries, but still use `RANK()` and `PARTITION BY g.group_id` to avoid all of the extra cruft. (You'll have to take my
word that there was a heap of it: the script that did all of this was 400 lines of code and I cbf reproducing/explaining all of it here.)

To be honest, I don't know why splitting things up again sucked, but it did. I wrote a stored procedure to do 89 per-leaderboard
ranking runs, in a loop, then manually called it; it ran for 40 minutes, then I made the executive decision that it was at least
as slow as the old way, so I killed it. Go figure. Maybe because it was pulling the entire table all 89 times to filter by `board`?

## Wrapping Up
Well, if you can't tell by the level of detail I put into those four ways above, we ended up going with the first one.
It's been live for approximately 12 months (since 18/01/2024) and we haven't seen any timeouts since. At one point I threatened to
make it run more-often with the shorter runtime, because our ranks do get a bit out-of-date only recalculating every 2 hours, but
that's a slope that only leads to "live rankings", which is a whole different beast I don't really want to bother with yet. Yet.

Thus ends the story; <a title='Danish: "And if they&#39;re not dead, they are still alive."'>og hvis de ikke er døde, lever de endnu.</a>
