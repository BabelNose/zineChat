// Populates the database with sample users, questions, answers, comments,
// tags and medals for local/manual testing. Safe to re-run: users and tags
// are upserted, so re-running mainly adds more questions/answers/comments.
//
// Usage: npm run seed   (run from the api/ package, against the DB in
// docker-compose; defaults to connecting on 127.0.0.1 since the script runs
// on the host, not inside the compose network)

import 'dotenv/config';
import pg from 'pg';
import { hash } from 'argon2';

const pool = new pg.Pool({
  host: process.env.SEED_DB_HOST || '127.0.0.1',
  port: Number(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || 'admin',
  password: process.env.POSTGRES_PASSWORD || 'root',
  database: process.env.POSTGRES_DB || 'zinechat',
});

const SEED_PASSWORD = 'Password123!';

const NEW_USERS = [
  { username: 'sam_writes', email: 'sam.writes@example.com' },
  { username: 'priya.codes', email: 'priya.codes@example.com' },
  { username: 'leo_travels', email: 'leo.travels@example.com' },
  { username: 'nadia_k', email: 'nadia.k@example.com' },
  { username: 'oscarb', email: 'oscar.b@example.com' },
  { username: 'finch_reads', email: 'finch.reads@example.com' },
  { username: 'ravi.patel', email: 'ravi.patel@example.com' },
  { username: 'june_makes', email: 'june.makes@example.com' },
  { username: 'tobydraws', email: 'toby.draws@example.com' },
  { username: 'elena.codes', email: 'elena.codes@example.com' },
  { username: 'marcus_runs', email: 'marcus.runs@example.com' },
  { username: 'ivy_bakes', email: 'ivy.bakes@example.com' },
  { username: 'kwame.dev', email: 'kwame.dev@example.com' },
  { username: 'sofia_shoots', email: 'sofia.shoots@example.com' },
  { username: 'hank_builds', email: 'hank.builds@example.com' },
  { username: 'lena_plays', email: 'lena.plays@example.com' },
  { username: 'dmitri.k', email: 'dmitri.k@example.com' },
  { username: 'amara_writes', email: 'amara.writes@example.com' },
  { username: 'quinnfoster', email: 'quinn.foster@example.com' },
  { username: 'yusuf.codes', email: 'yusuf.codes@example.com' },
];

const TAGS = [
  'javascript', 'python', 'career', 'writing', 'cooking', 'travel',
  'productivity', 'design', 'music', 'fitness', 'books', 'gaming',
  'photography', 'startups', 'diy',
];

const QUESTIONS = [
  { text: "What's the cleanest way to handle async errors in JavaScript without wrapping everything in try/catch?", tags: ['javascript'] },
  { text: 'How do you stay motivated when learning to code after a long day at work?', tags: ['career', 'productivity'] },
  { text: "Best practices for structuring a Python project that's going to grow past a single script?", tags: ['python'] },
  { text: 'How did you land your first job as a developer with no prior experience?', tags: ['career'] },
  { text: "What's your go-to method for getting past writer's block when working on a personal zine?", tags: ['writing'] },
  { text: 'Any tips for self-publishing a small print run of a zine without breaking the bank?', tags: ['writing', 'diy'] },
  { text: "What's a beginner-friendly recipe that always impresses guests?", tags: ['cooking'] },
  { text: "How do you meal prep for a week without everything tasting the same by Friday?", tags: ['cooking', 'productivity'] },
  { text: "What's the most underrated destination you've traveled to that isn't overrun with tourists?", tags: ['travel'] },
  { text: 'How do you budget for a three-month backpacking trip without draining your savings?', tags: ['travel'] },
  { text: "What's the one productivity system that actually stuck for you long-term?", tags: ['productivity'] },
  { text: "How do you avoid burnout when you're both working full-time and freelancing on the side?", tags: ['career', 'productivity'] },
  { text: "What's a good starting point for someone who wants to get into UI design with zero background?", tags: ['design'] },
  { text: "How important is typography when you're designing something like a zine or a small magazine?", tags: ['design', 'writing'] },
  { text: 'What albums changed the way you think about music production?', tags: ['music'] },
  { text: 'How do you practice an instrument consistently when motivation comes and goes?', tags: ['music'] },
  { text: "What's a home workout routine that doesn't require any equipment but still gets results?", tags: ['fitness'] },
  { text: 'How do you stay consistent with running when the weather makes it miserable half the year?', tags: ['fitness'] },
  { text: 'What books completely changed how you think about creativity?', tags: ['books'] },
  { text: "Looking for recommendations: best sci-fi novels for someone who's only read fantasy so far?", tags: ['books'] },
  { text: "What's the best co-op game to play with a partner who doesn't usually game?", tags: ['gaming'] },
  { text: "How do you build a gaming backlog you'll actually finish instead of just buying more games?", tags: ['gaming'] },
  { text: 'What camera settings do you default to for low-light street photography?', tags: ['photography'] },
  { text: 'Is it worth learning film photography in 2026 or is that just nostalgia talking?', tags: ['photography'] },
  { text: "What's one thing you wish you knew before trying to launch a small startup?", tags: ['startups'] },
  { text: 'How do you validate an idea for a side project before spending months building it?', tags: ['startups', 'productivity'] },
  { text: "What's a small DIY home improvement project that made a bigger difference than expected?", tags: ['diy'] },
  { text: 'How do you get comfortable using power tools if you never grew up around them?', tags: ['diy'] },
  { text: 'What is the difference between var, let, and const that actually matters in practice?', tags: ['javascript'] },
  { text: 'How do you decide between a list comprehension and a regular loop in Python?', tags: ['python'] },
];

const ANSWER_TEMPLATES = [
  'This really depends on your specific situation, but in my experience starting small and iterating works better than trying to get it perfect from day one.',
  "I struggled with this for a long time until I just committed to a simple routine and stuck with it for a month before judging the results.",
  "Honestly the biggest unlock for me was asking people who'd already done it instead of trying to figure it out alone.",
  "I'd say don't overthink it — pick an approach, try it for a couple weeks, and adjust based on what you actually notice.",
  'One thing that helped a lot was breaking it down into much smaller steps than I initially thought I needed.',
  'In my experience the tools matter way less than just being consistent about showing up.',
  "I went down a rabbit hole of research before I started and honestly wish I'd just started sooner.",
  "This is one of those things where the 'best' answer is really just whatever you'll actually stick with.",
  'I had a mentor tell me to focus on fundamentals first, and that advice has held up for years now.',
  'The turning point for me was tracking my progress somewhere visible — it made a huge difference in staying motivated.',
  'I tried a bunch of different approaches before landing on something that finally clicked for me.',
  'Honestly, community made the biggest difference — having other people to compare notes with kept me accountable.',
  "I'd avoid overcomplicating it early on. Simple and boring usually wins over the long run.",
  'What worked for me was setting a really low bar to get started, then letting momentum take over.',
  "I made a lot of mistakes early on, but each one taught me something I couldn't have learned otherwise.",
  "It's worth experimenting for yourself, but a lot of people I trust land on roughly the same conclusion here.",
  'I switched my approach about halfway through and it made everything click into place.',
  'Not gonna lie, it took way longer than I expected, but it was worth it in the end.',
  'The short answer is: it depends, but here is what worked for me specifically.',
  "I wish someone had told me this earlier, but it's never too late to change course.",
];

const COMMENT_TEMPLATES = [
  'This is really helpful, thank you!',
  "I've been wondering about this for a while, great question.",
  'Totally agree with this.',
  "Interesting take, hadn't thought about it that way.",
  'Following this thread, curious what others think too.',
  'This matches my experience exactly.',
  'Can you say more about what worked for you specifically?',
  'Saving this for later, appreciate the detail.',
  'I had the opposite experience honestly.',
  'This is such an underrated question.',
  "Same boat here, good to know I'm not alone.",
  "Solid advice, wish I'd read this sooner.",
  'Adding this to my list of things to try.',
  'Thanks for sharing, this is exactly what I needed.',
  'Would love to hear if this holds up long-term.',
  'This thread is gold.',
  'Bookmarking this one.',
  'Great answers in here already.',
  'Curious how this changes for beginners vs more experienced people.',
  'Appreciate you taking the time to explain this.',
  'Wow, never thought about it from this angle.',
  'This deserves more attention.',
  'Coming back to this one a lot lately.',
  "Not what I expected, but it makes sense."
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function pickDistinct(arr, n) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    out.push(copy.splice(randomInt(0, copy.length - 1), 1)[0]);
  }
  return out;
}

function daysAgo(maxDays) {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, maxDays));
  d.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59), 0);
  return d;
}

function afterDate(base) {
  const start = base.getTime();
  const now = Date.now();
  if (start >= now) return new Date(now);
  return new Date(randomInt(start, now));
}

async function main() {
  console.log(`Connecting to ${pool.options.database} on ${pool.options.host}:${pool.options.port}...`);

  const passwordHash = await hash(SEED_PASSWORD);

  let insertedUsers = 0;
  for (const u of NEW_USERS) {
    const res = await pool.query(
      `INSERT INTO "user" (username, email, password) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING RETURNING id`,
      [u.username, u.email, passwordHash],
    );
    if (res.rows[0]) insertedUsers++;
  }
  console.log(`Inserted ${insertedUsers} new users (password for all seeded users: "${SEED_PASSWORD}")`);

  const { rows: allUsers } = await pool.query('SELECT id, username FROM "user"');
  console.log(`${allUsers.length} users available total`);

  for (const tag of TAGS) {
    await pool.query('INSERT INTO tag (tag) VALUES ($1) ON CONFLICT (tag) DO NOTHING', [tag]);
  }
  const { rows: allTags } = await pool.query('SELECT id, tag FROM tag');
  const tagIdByName = new Map(allTags.map((t) => [t.tag, t.id]));

  const questionRows = [];
  for (const q of QUESTIONS) {
    const author = pick(allUsers);
    const created = daysAgo(90);
    const res = await pool.query(
      `INSERT INTO question (question, "authorId", created) VALUES ($1, $2, $3) RETURNING id, created`,
      [q.text, author.id, created],
    );
    questionRows.push({ id: res.rows[0].id, created: res.rows[0].created });

    for (const tagName of q.tags) {
      const tagId = tagIdByName.get(tagName);
      if (tagId) {
        await pool.query(
          'INSERT INTO question_tag (question_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [res.rows[0].id, tagId],
        );
      }
    }
  }
  console.log(`Inserted ${questionRows.length} questions`);

  const answers = [];
  for (const question of questionRows) {
    const answerCount = randomInt(3, 5);
    const authors = pickDistinct(allUsers, Math.min(answerCount, allUsers.length));
    for (let i = 0; i < answerCount; i++) {
      const author = authors[i % authors.length];
      const created = afterDate(question.created);
      const res = await pool.query(
        `INSERT INTO answer (answer, "authorId", "questionId", created) VALUES ($1, $2, $3, $4) RETURNING id`,
        [pick(ANSWER_TEMPLATES), author.id, question.id, created],
      );
      answers.push({ id: res.rows[0].id, authorId: author.id });
    }
  }
  console.log(`Inserted ${answers.length} answers`);

  let commentCount = 0;
  for (const question of questionRows) {
    const n = randomInt(10, 15);
    for (let i = 0; i < n; i++) {
      const author = pick(allUsers);
      const created = afterDate(question.created);
      await pool.query(
        `INSERT INTO comment (comment, "authorId", "questionId", created) VALUES ($1, $2, $3, $4)`,
        [pick(COMMENT_TEMPLATES), author.id, question.id, created],
      );
      commentCount++;
    }
  }
  console.log(`Inserted ${commentCount} comments`);

  let medalCount = 0;
  for (const answer of answers) {
    if (Math.random() < 0.45) {
      const eligible = allUsers.filter((u) => u.id !== answer.authorId);
      const awarders = pickDistinct(eligible, randomInt(1, 3));
      for (const awarder of awarders) {
        await pool.query(
          'INSERT INTO answer_medals (answer_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [answer.id, awarder.id],
        );
        medalCount++;
      }
    }
  }
  console.log(`Awarded ${medalCount} medals across answers`);

  await pool.end();
  console.log('Done.');
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
