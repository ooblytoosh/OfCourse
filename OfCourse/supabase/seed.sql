-- OfCourse demo data.
--
-- Everything below is FICTIONAL demo content: the students are made up, and
-- every post and comment was written for this demo. Nothing is copied from real
-- course materials. Demo accounts use the reserved ofcourse.example domain and
-- have no password, so nobody can sign in as them.
--
-- Safe to re-run: every insert skips rows that already exist.

begin;

-- ---------------------------------------------------------------------------
-- University & courses
-- ---------------------------------------------------------------------------

-- Students at these universities can verify with their school email.
-- (Subdomains count too, e.g. andrew.cmu.edu matches cmu.edu.)
insert into public.universities (name, short_name, domain)
values
  ('Georgia Institute of Technology', 'Georgia Tech', 'gatech.edu'),
  ('Emory University', 'Emory', 'emory.edu'),
  ('University of Georgia', 'UGA', 'uga.edu'),
  ('Georgia State University', 'Georgia State', 'gsu.edu'),
  ('Massachusetts Institute of Technology', 'MIT', 'mit.edu'),
  ('Stanford University', 'Stanford', 'stanford.edu'),
  ('University of California, Berkeley', 'UC Berkeley', 'berkeley.edu'),
  ('University of California, Los Angeles', 'UCLA', 'ucla.edu'),
  ('Carnegie Mellon University', 'Carnegie Mellon', 'cmu.edu'),
  ('University of Michigan', 'Michigan', 'umich.edu'),
  ('University of Illinois Urbana-Champaign', 'UIUC', 'illinois.edu'),
  ('Purdue University', 'Purdue', 'purdue.edu'),
  ('The University of Texas at Austin', 'UT Austin', 'utexas.edu'),
  ('Cornell University', 'Cornell', 'cornell.edu'),
  ('New York University', 'NYU', 'nyu.edu')
on conflict (domain) do update set name = excluded.name, short_name = excluded.short_name;

insert into public.courses (university_id, code, slug, name, description)
select u.id, c.code, c.slug, c.name, c.description
from public.universities u
cross join (values
  ('CS 1332', 'cs1332', 'Data Structures & Algorithms',
   'Lists, trees, heaps, hashing, sorting and graph algorithms, plus the Big-O analysis behind them.'),
  ('CS 2110', 'cs2110', 'Computer Organization & Programming',
   'Digital logic, the LC-3, assembly language and C: how software meets hardware.'),
  ('MATH 1554', 'math1554', 'Linear Algebra',
   'Systems of equations, matrices, determinants, eigenvalues and linear transformations.')
) as c (code, slug, name, description)
where u.domain = 'gatech.edu'
on conflict (university_id, code) do update
  set slug = excluded.slug, name = excluded.name, description = excluded.description;

insert into public.course_stats
  (course_id, workload_hours_per_week, difficulty, would_take_again_pct, response_count, is_demo)
select c.id, s.hours, s.difficulty, s.again, s.responses, true
from public.courses c
join (values
  ('cs1332',   12.0, 7.4, 81, 214),
  ('cs2110',   14.0, 7.9, 74, 168),
  ('math1554',  8.0, 6.1, 77, 131)
) as s (slug, hours, difficulty, again, responses) on s.slug = c.slug
on conflict (course_id) do nothing;

insert into public.topics (course_id, name)
select c.id, t.name
from public.courses c
join (values
  ('cs1332', 'Big-O'), ('cs1332', 'Linked Lists'), ('cs1332', 'Recursion'),
  ('cs1332', 'Trees'), ('cs1332', 'BSTs'), ('cs1332', 'AVL Trees'),
  ('cs1332', 'Heaps'), ('cs1332', 'Hashing'), ('cs1332', 'Sorting'),
  ('cs1332', 'Graphs'), ('cs1332', 'BFS'), ('cs1332', 'DFS'),
  ('cs1332', 'Dynamic Programming'),
  ('cs2110', 'Digital Logic'), ('cs2110', 'LC-3'), ('cs2110', 'Assembly'),
  ('cs2110', 'C'), ('cs2110', 'Pointers'),
  ('math1554', 'Row Reduction'), ('math1554', 'Determinants'),
  ('math1554', 'Eigenvalues'), ('math1554', 'Transformations')
) as t (slug, name) on t.slug = c.slug
on conflict (course_id, name) do nothing;

-- ---------------------------------------------------------------------------
-- Demo students
-- ---------------------------------------------------------------------------

create temp table demo_users (n int primary key, name text, username text, major text, grad_year int, bio text default null)
on commit drop;

insert into demo_users values
  (1, 'Alex Chen', 'alexchen', 'Computer Science', 2027),
  (2, 'Jordan Kim', 'jordankim', 'Computer Science', 2027),
  (3, 'Priya Natarajan', 'priyan', 'Computer Science', 2027),
  (4, 'Marcus Johnson', 'marcusj', 'Computer Engineering', 2026),
  (5, 'Sofia Ramirez', 'sofiar', 'Computer Science', 2028),
  (6, 'Ethan Park', 'ethanpark', 'Mathematics', 2027),
  (7, 'Aisha Bello', 'aishab', 'Computer Science', 2026),
  (8, 'Liam O''Connor', 'liamoc', 'Industrial Engineering', 2027),
  (9, 'Mei Tanaka', 'meitanaka', 'Computer Science', 2028),
  (10, 'Daniel Okafor', 'dokafor', 'Computer Science', 2026),
  (11, 'Hannah Weiss', 'hweiss', 'Computational Media', 2027),
  (12, 'Ravi Shah', 'ravishah', 'Computer Science', 2027),
  (13, 'Chloe Martin', 'chloem', 'Computer Science', 2028),
  (14, 'Noah Williams', 'noahw', 'Electrical Engineering', 2026),
  (15, 'Grace Liu', 'graceliu', 'Computer Science', 2027),
  (16, 'Omar Haddad', 'omarh', 'Computer Science', 2028),
  (17, 'Isabella Rossi', 'bellarossi', 'Neuroscience', 2027),
  (18, 'Tyler Brooks', 'tbrooks', 'Computer Science', 2026),
  (19, 'Ana Souza', 'anasouza', 'Computer Science', 2028),
  (20, 'Kevin Nguyen', 'kevinn', 'Computer Science', 2027),
  (21, 'Zara Ahmed', 'zaraahmed', 'Computational Media', 2028),
  (22, 'Ben Carter', 'bcarter', 'Aerospace Engineering', 2027),
  (23, 'Lucia Fernandez', 'luciaf', 'Computer Science', 2027),
  (24, 'Sam Patel', 'sampatel', 'Computer Science', 2026),
  (25, 'Emily Zhang', 'emzhang', 'Computer Science', 2028),
  (26, 'Jamal Wright', 'jamalw', 'Computer Engineering', 2027),
  (27, 'Nina Petrova', 'ninap', 'Mathematics', 2026),
  (28, 'Caleb Foster', 'calebf', 'Computer Science', 2027),
  (29, 'Yuki Sato', 'yukisato', 'Computer Science', 2028),
  (30, 'Maya Robinson', 'mayar', 'Biomedical Engineering', 2027);

update demo_users d set bio = b.bio
from (values
  (1, 'I learn best by drawing things out and then implementing them.'),
  (2, 'Trees, graphs and too much coffee. Happy to explain rotations to anyone.'),
  (3, 'CS 4641 was rough but worth it. Ask me about AI electives.'),
  (4, 'Hardware person who learned to love data structures.'),
  (15, 'Graph algorithms enthusiast. I make study guides for fun.')
) as b (n, bio)
where d.n = b.n;

-- Deterministic ids so the seed can be re-run safely.
create or replace function pg_temp.demo_id(prefix text, n int) returns uuid
language sql immutable as $$
  select (prefix || '0000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid
$$;

-- Auth accounts with no password (sign-in impossible). The on_auth_user_created
-- trigger creates each profile.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', pg_temp.demo_id('d', n), 'authenticated',
  'authenticated', username || '@ofcourse.example', '', now(),
  '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('name', name),
  now() - interval '400 days', now(), '', '', '', ''
from demo_users
on conflict (id) do nothing;

-- Demo students are shown as verified Georgia Tech students. (Real users are
-- only verified by confirming a university email address.)
update public.profiles p
set username = d.username,
    major = d.major,
    grad_year = d.grad_year,
    bio = d.bio,
    university_id = (select id from public.universities where domain = 'gatech.edu'),
    verified = true,
    verified_at = coalesce(p.verified_at, now() - interval '300 days'),
    created_at = least(p.created_at, now() - interval '400 days' + d.n * interval '3 days')
from demo_users d
where p.id = pg_temp.demo_id('d', d.n);

-- Memberships: everyone is in CS 1332, some in the other two.
insert into public.course_members (user_id, course_id, semester)
select pg_temp.demo_id('d', d.n), c.id,
       (array['Spring 2026', 'Fall 2025', 'Summer 2026', 'Spring 2025'])[1 + d.n % 4]
from demo_users d
join public.courses c
  on c.slug = 'cs1332'
  or (c.slug = 'cs2110' and d.n % 2 = 0)
  or (c.slug = 'math1554' and d.n % 3 = 0)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------------

create temp table demo_posts (
  n int primary key, course text, author int, type public.post_type, title text,
  content text, semester text, days_ago numeric, popularity int
) on commit drop;

insert into demo_posts values
(1, 'cs1332', 1, 'study_guide', 'How I studied for CS 1332 (and went from panicking to an A)',
$t$I was genuinely worried after the first couple of weeks, so here's the routine that turned it around for me.

1. Implement every data structure yourself, from scratch, before the assignment asks for it. Reading about a linked list and writing one are completely different skills.
2. Keep a "complexity journal." Every time we covered an operation, I wrote down its best, average and worst case and one sentence on WHY. Re-reading the whys is what made Big-O stick.
3. Trace on paper. For trees I drew every insert and removal by hand until I could predict the shape without thinking.
4. Teach it. My roommate isn't in CS, and explaining heaps to her exposed every gap I had.

Time-wise I averaged about 12 hours a week, more in the weeks with trees and graphs. Start early, ask questions early, and don't just read your code, test it with weird inputs.$t$,
'Spring 2026', 40, 88),

(2, 'cs1332', 2, 'explanation', 'Why do AVL rotations actually work?',
$t$Rotations felt like magic until I realized they are just a way to re-pick the root of a small subtree while keeping BST order.

Take the right-right case: A has right child B, and B has right child C. The subtree leans right. A single left rotation makes B the new root, with A as its left child and C as its right child.

Why is order preserved? Everything in B's old left subtree is bigger than A but smaller than B, so it slots in perfectly as A's new right subtree. Nothing crosses the BST boundary.

Why does height shrink? The long path A → B → C becomes B with two children of equal height, so the imbalance disappears.

Double rotations are the same idea when the heavy grandchild is on the "inside": rotate the child first to turn it into the straight-line case, then rotate the root. Once I drew all four cases side by side, I stopped memorizing and started seeing.$t$,
'Spring 2026', 30, 80),

(3, 'cs1332', 4, 'advice', 'Start the coding assignments the day they come out. Seriously.',
$t$Not to scare anyone, but the biggest mistake I made was treating the assignments like something to do the weekend before they were due.

The code itself usually isn't long. What takes time is the edge cases: empty structures, a single element, removing the root, duplicates, null inputs. Those only show up when you test, and testing takes days, not hours.

What worked once I changed my approach:
- Day 1: read the spec and write down every edge case you can think of.
- Day 2–3: get a basic version working.
- Remaining days: write your own tests and break your own code.

Starting early also means you can go to office hours with a specific question instead of "I don't know where to start."$t$,
'Fall 2025', 120, 72),

(4, 'cs1332', 3, 'note', 'My one-page Big-O cheat sheet for every structure we covered',
$t$My own summary, typed up from my notes. Average case unless noted.

ArrayList: access O(1), add to back O(1) amortized, add to front O(n)
Singly linked list (with tail): add to front/back O(1), remove from back O(n)
Stack / Queue (array- or list-backed): push/pop/enqueue/dequeue O(1)
BST: search/insert/remove O(log n) average, O(n) worst (degenerate tree)
AVL tree: search/insert/remove O(log n) worst case, thanks to rebalancing
Heap: add/remove O(log n), peek O(1), build from array O(n)
Hash map: put/get/remove O(1) average, O(n) worst with bad collisions

Sorts:
Bubble / insertion / selection: O(n²) worst; insertion is O(n) on nearly sorted data
Merge sort: O(n log n) always, stable, needs extra space
Quick sort: O(n log n) average, O(n²) worst with bad pivots
Heap sort: O(n log n), in place, not stable

The trick that helped me: for every entry, be able to say which step dominates.$t$,
'Spring 2026', 25, 84),

(5, 'cs1332', 5, 'discussion', 'BFS vs DFS: when does it actually matter which one you use?',
$t$I can implement both, but I get stuck deciding which one a problem wants. My current rule of thumb:

- BFS when I care about the fewest edges (shortest path in an unweighted graph), or want to explore "layer by layer."
- DFS when I need to fully explore one branch before backing up, like detecting cycles or checking whether something is reachable at all.

Is that the right way to think about it? Are there cases where either works and it's just preference?$t$,
'Summer 2026', 6, 48),

(6, 'cs1332', 6, 'explanation', 'Hash collisions explained with a parking lot analogy',
$t$Picture a parking lot with numbered spots. Your hash function looks at your license plate and tells you which spot to park in.

A collision is when your assigned spot is already taken. The strategies are just different parking policies:

- External chaining: every spot has a little lane behind it, and cars line up in that lane. Nobody moves; lanes just get longer.
- Linear probing: spot taken? Try the next one, then the next. Easy, but cars bunch up into long clusters.
- Quadratic probing: jump 1, then 4, then 9 spots away. Breaks up clusters, but you might never try some spots.
- Double hashing: a second function on your plate decides how far you jump each time.

Resizing is building a bigger lot and re-parking every car, because each car's spot depends on the lot size. That's why load factor matters: once the lot is mostly full, finding a spot gets slow for everyone.$t$,
'Spring 2026', 18, 64),

(7, 'cs1332', 7, 'study_guide', 'Sorting algorithms: my comparison table and how I remember each one',
$t$I kept mixing sorts up, so I made a memory hook for each.

Bubble sort: big values "bubble" to the end each pass. Stable, in place, O(n²).
Insertion sort: sorting a hand of cards. Great on nearly sorted input.
Selection sort: repeatedly select the smallest remaining. Always O(n²) comparisons, few swaps.
Merge sort: split until trivial, then merge. O(n log n) always, stable, needs extra space.
Quick sort: pick a pivot, partition around it, recurse. Fast in practice, but pivot choice matters.
Heap sort: build a heap and keep removing the top. O(n log n) and in place.
LSD radix sort: sort digit by digit from the least significant. Not comparison based.

For each one I practiced three things: sorting a small array by hand, saying whether it's stable, and naming its worst-case input.$t$,
'Fall 2025', 100, 70),

(8, 'cs1332', 8, 'discussion', 'Is CS 1332 manageable with 17 credit hours?',
$t$I'm planning a heavy semester and 1332 is the class I'm most nervous about. For people who took it alongside a full load: how did it go? Anything you'd drop or reorder? I'm not a CS major, so I'm also wondering whether that makes it harder.$t$,
'Summer 2026', 3, 30),

(9, 'cs1332', 9, 'explanation', 'Recursion finally clicked when I stopped tracing every call',
$t$For weeks I tried to trace recursion by following every single call down and back up. It works for tiny inputs and melts your brain for anything real.

What finally worked was the "trust" approach:
1. Handle the base case: what's the smallest input, and what's the answer?
2. Assume the recursive call already works on the smaller problem.
3. Ask only: given that answer, how do I build the answer for my current input?

Example: counting nodes in a tree. Base case: an empty tree has 0 nodes. Trust that count(left) and count(right) are correct. Then my answer is count(left) + count(right) + 1. Done, no tracing needed.

Tracing is still great for debugging, but writing recursion with trust is so much faster.$t$,
'Spring 2026', 12, 58),

(10, 'cs1332', 10, 'note', 'Heaps: my notes on up-heap, down-heap and building a heap',
$t$Personal notes, min-heap version, array-backed with the root at index 1.

- Parent of i: i / 2. Children of i: 2i and 2i + 1.
- Add: put the new item at the end, then up-heap. Swap with the parent while it's smaller than the parent.
- Remove: take the root, move the last item to the root, then down-heap. Swap with the SMALLER child while it's bigger than a child.
- Build heap: start at the last non-leaf (size / 2) and down-heap every index down to 1.

Things I got wrong at first: forgetting to compare with the smaller child, and off-by-one errors from mixing 0-based and 1-based indexing. Pick one convention and write it at the top of your code.$t$,
'Spring 2026', 35, 52),

(11, 'cs1332', 11, 'advice', 'How to use office hours without feeling lost',
$t$I avoided office hours for half the semester because I felt like my questions were too basic. Big mistake.

What made them useful:
- Bring a specific example: "my remove fails when the node has two children" beats "remove doesn't work."
- Write down what you already tried. TAs can help much faster when they know where you are.
- Go early in the week. The day before something is due, the line is long and everyone is stressed.
- Ask about concepts too, not only code. Some of my best sessions were just "can you explain why this is O(log n)?"

Nobody judged me for basic questions. They had seen them all before.$t$,
'Fall 2025', 90, 42),

(12, 'cs1332', 12, 'explanation', 'Dijkstra''s algorithm in plain English',
$t$Dijkstra's finds the cheapest path from one start vertex to every other vertex, as long as no edge weight is negative.

The plain-English version:
1. Everyone starts infinitely far away, except the start, at distance 0.
2. Repeatedly pick the unvisited vertex with the smallest known distance. That distance is now final.
3. For each neighbor, ask: "Is going through this vertex cheaper than what I knew before?" If so, update it.

A priority queue does the "pick the smallest" step efficiently.

Why no negative edges? Step 2 assumes nothing found later can make a finalized vertex cheaper. A negative edge could, and then the algorithm's promise breaks.$t$,
'Spring 2026', 20, 62),

(13, 'cs1332', 13, 'discussion', 'What''s the most intuitive way to think about BST deletion?',
$t$Zero and one child make sense to me. The two-children case is where I get lost. Why is replacing with the successor (or predecessor) always safe? And how do you all keep straight which one to use?$t$,
'Summer 2026', 2, 26),

(14, 'cs1332', 14, 'note', 'Linked list edge cases I kept getting wrong',
$t$A checklist I now run through for every linked list method:

- Empty list: does head (and tail) stay null correctly?
- One element: removing it must clear both head AND tail.
- Adding to the front of an empty list: tail needs to be set too.
- Removing the last node in a singly linked list: you need the node BEFORE it, so you walk the list.
- Size: update it in every path, including early returns.
- Doubly linked: every change touches two pointers. Draw the arrows before writing code.

Nearly all of my failed tests traced back to one of these.$t$,
'Fall 2025', 110, 36),

(15, 'cs1332', 15, 'study_guide', 'Graph algorithms study guide: BFS, DFS, Dijkstra, Prim, Kruskal',
$t$How I organized the graph unit in my head. My own summary, not official material.

Traversals
- BFS: queue plus visited set. Visits in order of distance (edge count).
- DFS: stack or recursion plus visited set. Goes deep before wide.

Shortest paths
- Dijkstra: priority queue by distance, non-negative weights.

Minimum spanning trees (connect everything as cheaply as possible)
- Prim: grow one tree outward, always taking the cheapest edge leaving it.
- Kruskal: sort all edges, add each one unless it would create a cycle (use disjoint sets to check).

Practice idea: draw one small weighted graph and run all five algorithms on it. Comparing the visit orders taught me more than any single problem did.$t$,
'Spring 2026', 15, 76),

(16, 'cs1332', 16, 'advice', 'Draw everything: my whiteboard habit for trees and graphs',
$t$I bought a cheap whiteboard and it was the best purchase of the semester. Before writing any tree or graph code, I draw the structure, then walk through the operation step by step with a marker.

Why it helps: bugs in pointer-heavy code are almost always "I updated the wrong reference" or "I forgot one." When you draw it, you can see the arrow you forgot to move.

Bonus: erasing and redrawing a rotation five times is weirdly calming.$t$,
'Spring 2026', 8, 40),

(17, 'cs1332', 18, 'explanation', 'Dynamic programming is just recursion with a notebook',
$t$DP scared me until someone described it as "recursion that writes down answers so it never solves the same subproblem twice."

Classic example: Fibonacci. Naive recursion recomputes fib(3) over and over, which is exponential. If you keep a table and check it before recursing, each value is computed once, which is linear.

Two ways to write it:
- Top-down (memoization): write the recursion, then add a cache.
- Bottom-up (tabulation): fill the table from the smallest subproblems up.

My checklist for any DP problem: What is a subproblem? What's the recurrence? What are the base cases? In what order do I fill the table?$t$,
'Spring 2026', 22, 66),

(18, 'cs1332', 19, 'discussion', 'Quick sort vs merge sort: which did you find harder to implement?',
$t$Merge sort was conceptually easy for me, but I kept messing up the merge step with indices. Quick sort's partitioning felt more fiddly at first but clicked after a while. Curious which one gave everyone else more trouble, and what helped.$t$,
'Summer 2026', 1, 16),

(19, 'cs1332', 20, 'note', 'Probing strategies side by side: linear, quadratic, double hashing',
$t$My notes comparing open addressing strategies. h is the hash index, i is the attempt number.

Linear: (h + i) mod capacity. Simple, but suffers from primary clustering.
Quadratic: (h + i²) mod capacity. Avoids primary clustering but can fail to find an open spot even when one exists.
Double hashing: (h + i · h2(key)) mod capacity. Spreads probes out the most, costs a second hash.

On removal with open addressing, you can't just empty the slot, or later searches stop too early. Mark it "deleted" instead, and reuse those slots on insert.$t$,
'Spring 2026', 28, 46),

(20, 'cs1332', 21, 'advice', 'What I''d tell myself on day one of 1332',
$t$If I could go back:

1. Big-O isn't a side topic. It's the language of the whole course. Get comfortable early.
2. Your own tests matter more than the ones you're given.
3. Don't skip lectures on "easy" structures. The patterns come back later in harder ones.
4. Form a study group by week three. Explaining things out loud is half the learning.
5. Sleep before big deadlines. Every bug I wrote at 3am took two hours to find the next day.

It's a hard class, but it's also the one where I felt like I really learned to program.$t$,
'Fall 2025', 130, 70),

(21, 'cs1332', 24, 'explanation', 'Why is building a heap O(n) and not O(n log n)?',
$t$Adding n items one by one is O(n log n). The bottom-up build is O(n). Here's the intuition.

In a complete tree, about half the nodes are leaves, and leaves need no work. A quarter of the nodes sit one level up and can move down at most 1 level. An eighth can move down at most 2 levels, and so on.

Total work ≈ n/4 · 1 + n/8 · 2 + n/16 · 3 + ...

That series adds up to a constant times n. Most nodes are near the bottom, where there's almost nowhere to fall. Only a handful of nodes near the top can move far.$t$,
'Summer 2026', 4, 34),

(22, 'cs1332', 25, 'discussion', 'Study group for Fall 2026? Meeting in the library',
$t$Starting a weekly study group for this semester. The plan is to pick one structure each week, implement it together, and quiz each other on complexity. Mostly first- and second-years so far. Comment if you're interested and which evenings work for you!$t$,
'Fall 2026', 0.5, 14),

-- CS 2110
(23, 'cs2110', 4, 'advice', 'Tips for getting comfortable with the LC-3',
$t$What helped me go from confused to comfortable with LC-3 assembly:
- Keep a one-page reference of the instructions and condition codes next to you at all times.
- Step through code in the simulator one instruction at a time and watch the registers change.
- Comment every line with what it means in plain English, like "R1 = address of array."
- Write the program in pseudocode or C first, then translate it.$t$,
'Spring 2026', 26, 58),

(24, 'cs2110', 26, 'explanation', 'Pointers finally made sense when I drew memory as a row of boxes',
$t$Think of memory as a long row of numbered boxes. A normal variable is a box holding a value. A pointer is a box holding the NUMBER of another box.

- &x asks "what's the number of x's box?"
- *p says "go to the box whose number is stored in p."

Arrays are then just consecutive boxes, and p + 1 means "the next box over" (scaled by the element size). Once I drew this out, pointer arithmetic stopped feeling like black magic.$t$,
'Fall 2025', 70, 62),

(25, 'cs2110', 14, 'note', 'Two''s complement in 5 minutes',
$t$My quick notes:
- To negate a number: flip every bit, then add 1.
- The leftmost bit tells you the sign (1 = negative).
- The range for n bits is -2^(n-1) to 2^(n-1) - 1.
- Overflow happens when adding two numbers of the same sign gives a result of the opposite sign.
- Sign extension: copy the sign bit to the left to widen a number without changing its value.$t$,
'Spring 2026', 45, 40),

(26, 'cs2110', 29, 'discussion', 'How much C should I know before starting?',
$t$I've only used Java and Python. Should I learn some C over break, or does the class start from zero? If you'd recommend prep, what should I focus on?$t$,
'Summer 2026', 5, 24),

(27, 'cs2110', 28, 'study_guide', 'My digital logic study guide: gates to state machines',
$t$How I built up the logic unit in my head:
1. Gates and truth tables. Be able to write any small function as a truth table.
2. Simplification. Practice turning truth tables into simpler expressions.
3. Combinational building blocks: multiplexers, decoders, adders.
4. Sequential logic: latches, then flip-flops, then registers.
5. State machines: draw the states first, then derive the transitions.
Redrawing each circuit from memory was the best test of whether I understood it.$t$,
'Fall 2025', 85, 50),

-- MATH 1554
(28, 'math1554', 27, 'explanation', 'Eigenvectors: the directions a matrix doesn''t turn',
$t$Most vectors change direction when you multiply them by a matrix. Eigenvectors are the special ones that only get stretched or shrunk, and the eigenvalue is the stretch factor.

So Av = λv literally says "A acts on v like plain multiplication by λ."

To find them, solve det(A - λI) = 0 for λ, then find the null space of A - λI for each λ. Picturing the stretch made the algebra feel like it was actually about something.$t$,
'Spring 2026', 33, 55),

(29, 'math1554', 6, 'advice', 'Row reduce slowly and check every step',
$t$Most of my lost points came from arithmetic slips in row reduction, not from misunderstanding concepts. Write one row operation per line, label it (like R2 → R2 − 3R1), and plug your final answer back into the original system. It feels slow, but it's faster than redoing a whole problem.$t$,
'Fall 2025', 95, 38),

(30, 'math1554', 30, 'note', 'Determinant properties I actually use',
$t$- Swapping two rows flips the sign.
- Scaling a row by k scales the determinant by k.
- Adding a multiple of one row to another doesn't change it.
- A triangular matrix's determinant is the product of the diagonal.
- det(AB) = det(A) · det(B).
- det(A) = 0 means A isn't invertible.$t$,
'Spring 2026', 16, 32),

(31, 'math1554', 23, 'discussion', 'Best way to build intuition for linear transformations?',
$t$I can compute things, but I don't "see" what a transformation does. Did anyone find a way to visualize them that helped? Right now I'm just memorizing which matrix rotates and which one shears.$t$,
'Summer 2026', 3, 20);

insert into public.posts
  (id, course_id, author_id, title, content, type, semester, integrity_attested_at, created_at, updated_at)
select pg_temp.demo_id('e', p.n), c.id, pg_temp.demo_id('d', p.author), p.title, p.content,
       p.type, p.semester, now() - p.days_ago * interval '1 day',
       now() - p.days_ago * interval '1 day', now() - p.days_ago * interval '1 day'
from demo_posts p
join public.courses c on c.slug = p.course
on conflict (id) do nothing;

insert into public.post_topics (post_id, topic_id)
select pg_temp.demo_id('e', pt.post), t.id
from (values
  (1, 'Big-O'), (1, 'Trees'), (1, 'Sorting'),
  (2, 'AVL Trees'), (2, 'Trees'),
  (3, 'Linked Lists'),
  (4, 'Big-O'), (4, 'Hashing'), (4, 'Heaps'),
  (5, 'Graphs'), (5, 'BFS'), (5, 'DFS'),
  (6, 'Hashing'),
  (7, 'Sorting'),
  (9, 'Recursion'), (9, 'Trees'),
  (10, 'Heaps'), (10, 'Trees'),
  (12, 'Graphs'),
  (13, 'BSTs'), (13, 'Trees'),
  (14, 'Linked Lists'),
  (15, 'Graphs'), (15, 'BFS'), (15, 'DFS'),
  (16, 'Trees'), (16, 'Graphs'),
  (17, 'Dynamic Programming'), (17, 'Recursion'),
  (18, 'Sorting'), (18, 'Recursion'),
  (19, 'Hashing'),
  (20, 'Big-O'),
  (21, 'Heaps'), (21, 'Big-O'),
  (23, 'LC-3'), (23, 'Assembly'),
  (24, 'Pointers'), (24, 'C'),
  (25, 'Digital Logic'),
  (26, 'C'),
  (27, 'Digital Logic'),
  (28, 'Eigenvalues'),
  (29, 'Row Reduction'),
  (30, 'Determinants'),
  (31, 'Transformations')
) as pt (post, topic)
join demo_posts p on p.n = pt.post
join public.courses c on c.slug = p.course
join public.topics t on t.course_id = c.id and t.name = pt.topic
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Comments (parent = null for top-level; replies point at a top-level comment)
-- ---------------------------------------------------------------------------

create temp table demo_comments (
  n int primary key, post int, author int, parent int, content text, hours_after numeric
) on commit drop;

insert into demo_comments values
(1, 1, 12, null, 'The complexity journal idea is so good. I''m stealing it for this semester.', 5),
(2, 1, 1, 1, 'Do it! Writing the "why" is the part that matters. The numbers alone won''t stick.', 7),
(3, 1, 5, null, 'How early did you start implementing things yourself? Before or after lecture?', 20),
(4, 1, 1, 3, 'Usually the same day as lecture, while it was fresh. Even a rough version helped.', 22),
(5, 1, 17, null, 'Explaining heaps to a non-CS roommate is peak studying. Respect.', 30),
(6, 1, 22, null, 'Saving this. 12 hrs/week matches what I''ve heard from friends too.', 50),
(7, 2, 13, null, 'The "re-pick the root while keeping BST order" framing finally made it click for me. Thank you!', 3),
(8, 2, 9, null, 'Drawing the four cases side by side is the move. I did the same with colored pens.', 12),
(9, 2, 2, 8, 'Colored pens for the heavy side are genius. Might redo my notes that way.', 14),
(10, 2, 16, null, 'Could you add how the balance factors change after a double rotation? That''s the part I still fumble.', 26),
(11, 2, 2, 10, 'Good call. Short version: after the rotation, the new subtree root always ends up with balance 0, and the other two depend on the grandchild''s original balance. I''ll write it up.', 30),
(12, 3, 20, null, 'Learned this the hard way. Edge cases took me 3x longer than the main logic.', 4),
(13, 3, 7, null, 'Writing edge cases on day 1 is underrated. It basically writes your tests for you.', 9),
(14, 4, 15, null, 'This is exactly the format I needed. Printed it out.', 2),
(15, 4, 24, null, 'Might be worth noting ArrayList add to the back is O(n) worst case when it resizes. Amortized O(1) is the key word.', 6),
(16, 4, 3, 15, 'Yes! Added "amortized" for exactly that reason. Resizing is the rare expensive case.', 8),
(17, 4, 10, null, '"Be able to say which step dominates" is the real lesson here.', 18),
(18, 5, 12, null, 'Your rule of thumb is solid. One more: BFS uses more memory on wide graphs, DFS on very deep ones.', 3),
(19, 5, 5, 18, 'Oh, that''s a good point I hadn''t thought about. Thanks!', 5),
(20, 5, 15, null, 'For plain reachability either works, and it really is preference. I usually pick DFS because recursion is shorter to write.', 10),
(21, 6, 11, null, 'The parking lot analogy is perfect. Load factor makes so much more sense now.', 4),
(22, 6, 20, null, 'Linear probing clusters = cars bunching up in one corner of the lot. I''ll never forget that.', 12),
(23, 7, 25, null, 'The card-hand hook for insertion sort is the one I use too.', 6),
(24, 7, 18, null, 'Practicing "worst-case input" for each sort is great advice. I kept forgetting quick sort''s.', 15),
(25, 8, 7, null, 'I did it with 16 hours and it was fine, but I dropped everything else during the tree weeks. Plan your schedule around those.', 5),
(26, 8, 22, null, 'Non-CS major here too. It''s very doable. Just start assignments early and go to office hours.', 9),
(27, 8, 8, 26, 'That''s reassuring, thank you!', 11),
(28, 9, 3, null, 'Trusting the recursive call is the whole secret. Wish someone had told me sooner.', 6),
(29, 9, 26, null, 'This is how I explain it to people I tutor now. Base case, trust, combine.', 20),
(30, 10, 21, null, 'The smaller-child mistake got me too. Great notes.', 8),
(31, 10, 19, null, '0-based vs 1-based messed me up for an entire evening, lol.', 16),
(32, 11, 13, null, 'Going early in the week is so real. The night before is chaos.', 5),
(33, 12, 16, null, 'The explanation of why negative edges break it is the clearest I''ve read.', 7),
(34, 12, 27, null, 'For negative edges, look into Bellman-Ford. Slower, but it handles them.', 15),
(35, 12, 12, 34, 'Yep, good addition for anyone curious.', 18),
(36, 13, 2, null, 'The successor is the smallest value in the right subtree, so it''s bigger than everything on the left and smaller than everything else on the right. That''s why it can take the deleted node''s spot.', 2),
(37, 13, 13, 36, 'Ohhh, so it''s the one value that fits in both directions. That makes sense!', 4),
(38, 13, 9, null, 'Either successor or predecessor works. Just be consistent with whichever your implementation uses.', 6),
(39, 14, 4, null, '"Removing it must clear both head AND tail" cost me so many test cases.', 9),
(40, 15, 1, null, 'Running all five on the same graph is a great idea. Doing that this weekend.', 5),
(41, 15, 23, null, 'Kruskal plus disjoint sets was the hardest part for me. Nice summary.', 11),
(42, 15, 15, 41, 'Same! Drawing the sets merging helped a lot.', 13),
(43, 16, 30, null, 'Whiteboard gang. Also works great for graphs.', 5),
(44, 17, 6, null, 'Recursion with a notebook. Love it.', 4),
(45, 17, 12, null, 'Top-down was easier for me to write first, then I''d convert to bottom-up.', 9),
(46, 18, 10, null, 'Quick sort for me. Partitioning with duplicates was painful.', 3),
(47, 18, 19, 46, 'Duplicates were my nightmare too!', 5),
(48, 19, 6, null, 'The note about marking deleted slots is so important. Classic bug.', 6),
(49, 20, 9, null, 'Number 5 is the most underrated advice here.', 8),
(50, 20, 14, null, 'Study group by week three, 100%. Mine carried me.', 20),
(51, 21, 24, null, 'The "most nodes are near the bottom" intuition is perfect.', 3),
(52, 22, 29, null, 'Interested! Tuesday or Thursday evenings work for me.', 2),
(53, 22, 5, null, 'Count me in. Thursdays are best.', 5),
(54, 23, 26, null, 'Commenting every line saved me so much debugging time.', 8),
(55, 24, 4, null, 'Row of boxes is exactly how I think about it too.', 6),
(56, 26, 28, null, 'A little prep helps, but it''s not required. Knowing basic pointers makes the first weeks smoother.', 4),
(57, 28, 6, null, 'The picture of stretching without turning is what made it click for me too.', 10),
(58, 31, 27, null, 'Watch where the two basis vectors go. The columns of the matrix are literally where they land.', 4);

insert into public.comments (id, post_id, author_id, parent_comment_id, content, created_at, updated_at)
select pg_temp.demo_id('c', dc.n), pg_temp.demo_id('e', dc.post), pg_temp.demo_id('d', dc.author),
       case when dc.parent is null then null else pg_temp.demo_id('c', dc.parent) end,
       dc.content,
       now() - p.days_ago * interval '1 day' + dc.hours_after * interval '1 hour',
       now() - p.days_ago * interval '1 day' + dc.hours_after * interval '1 hour'
from demo_comments dc
join demo_posts p on p.n = dc.post
order by dc.n
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Votes: a deterministic pseudo-random subset of students upvotes each post,
-- sized by the post's popularity.
-- ---------------------------------------------------------------------------

insert into public.votes (post_id, user_id, value)
select pg_temp.demo_id('e', p.n), pg_temp.demo_id('d', d.n), 1
from demo_posts p
cross join demo_users d
where d.n <> p.author
  and abs(hashtext(p.n::text || '-' || d.n::text)) % 100 < p.popularity
on conflict (post_id, user_id) do nothing;

commit;
