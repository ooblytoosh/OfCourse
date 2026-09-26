-- Starter data so course communities exist before anyone signs up.
-- Safe to re-run.

insert into public.universities (name, domain)
values ('Georgia Institute of Technology', 'gatech.edu')
on conflict (domain) do nothing;

insert into public.courses (university_id, code, name, description)
select u.id, c.code, c.name, c.description
from public.universities u
cross join (values
  ('CS 1332',   'Data Structures and Algorithms',
   'Lists, trees, hashing, sorting, graphs, and the analysis behind them.'),
  ('CS 2110',   'Computer Organization and Programming',
   'Digital logic, the LC-3, assembly, and C.'),
  ('MATH 1554', 'Linear Algebra',
   'Systems of equations, vector spaces, eigenvalues, and applications.')
) as c (code, name, description)
where u.domain = 'gatech.edu'
on conflict (university_id, code) do nothing;
