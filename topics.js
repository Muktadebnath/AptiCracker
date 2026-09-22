/**
 * TOPICS AND CURRICULUM
 * ---------------------
 * This is the file to edit if you want a different 12-week plan.
 *
 *  1. DEFAULT_TOPICS: every topic, as [id, section, name].
 *  2. CURRICULUM: for each week, a list of "blocks". One block = one study day.
 *       'q_num'                  -> one topic (learn + practice + review + revise tasks)
 *       ['q_simp', 'q_frac']     -> two topics on the same day
 *       rev(...), sect(...), custom(...), MIX -> special days (revision, timed tests, mixed practice)
 *     If a week has more blocks than study days, some days get two blocks.
 *     If it has fewer, the extra days repeat a topic as a "Practice set 2".
 */

export const DEFAULT_TOPICS = [
  // ---- Quantitative aptitude ----
  ['q_num', 'quant', 'Number system'],
  ['q_div', 'quant', 'Divisibility rules'],
  ['q_hcf', 'quant', 'HCF and LCM'],
  ['q_simp', 'quant', 'Simplification'],
  ['q_frac', 'quant', 'Fractions and decimals'],
  ['q_pct', 'quant', 'Percentages'],
  ['q_pl', 'quant', 'Profit, loss and discount'],
  ['q_ratio', 'quant', 'Ratio and proportion'],
  ['q_avg', 'quant', 'Averages'],
  ['q_si', 'quant', 'Simple interest'],
  ['q_ci', 'quant', 'Compound interest'],
  ['q_tsd', 'quant', 'Time, speed and distance'],
  ['q_trains', 'quant', 'Problems on trains'],
  ['q_boats', 'quant', 'Boats and streams'],
  ['q_tw', 'quant', 'Time and work'],
  ['q_pipes', 'quant', 'Pipes and cisterns'],
  ['q_mixtures', 'quant', 'Mixtures and allegations'],
  ['q_ages', 'quant', 'Problems on ages'],
  ['q_algebra', 'quant', 'Algebra'],
  ['q_equations', 'quant', 'Equations'],
  ['q_prog', 'quant', 'Progressions'],
  ['q_pc', 'quant', 'Permutations and combinations'],
  ['q_prob', 'quant', 'Probability'],
  ['q_geo', 'quant', 'Geometry'],
  ['q_mens', 'quant', 'Mensuration'],
  ['q_di', 'quant', 'Data interpretation'],
  // ---- Logical reasoning ----
  ['l_numseries', 'logical', 'Number series'],
  ['l_alpha', 'logical', 'Alphabet series'],
  ['l_analogy', 'logical', 'Analogy'],
  ['l_class', 'logical', 'Classification'],
  ['l_coding', 'logical', 'Coding-decoding'],
  ['l_blood', 'logical', 'Blood relations'],
  ['l_direction', 'logical', 'Direction sense'],
  ['l_ranking', 'logical', 'Ranking and ordering'],
  ['l_syllogism', 'logical', 'Syllogisms'],
  ['l_inequal', 'logical', 'Inequalities'],
  ['l_venn', 'logical', 'Venn diagrams'],
  ['l_seating', 'logical', 'Seating arrangements'],
  ['l_linear', 'logical', 'Linear arrangements'],
  ['l_circ', 'logical', 'Circular arrangements'],
  ['l_puz', 'logical', 'Puzzles'],
  ['l_clocks', 'logical', 'Clocks'],
  ['l_cal', 'logical', 'Calendars'],
  ['l_cubes', 'logical', 'Cubes and dice'],
  ['l_ds', 'logical', 'Data sufficiency'],
  ['l_sc', 'logical', 'Statement and conclusion'],
  ['l_sa', 'logical', 'Statement and assumption'],
  ['l_io', 'logical', 'Input-output reasoning'],
  // ---- Verbal aptitude ----
  ['v_vocab', 'verbal', 'Vocabulary'],
  ['v_syn', 'verbal', 'Synonyms'],
  ['v_ant', 'verbal', 'Antonyms'],
  ['v_onew', 'verbal', 'One-word substitutions'],
  ['v_idioms', 'verbal', 'Idioms and phrases'],
  ['v_pos', 'verbal', 'Parts of speech'],
  ['v_tenses', 'verbal', 'Tenses'],
  ['v_subverb', 'verbal', 'Subject-verb agreement'],
  ['v_artprep', 'verbal', 'Articles and prepositions'],
  ['v_sentcorr', 'verbal', 'Sentence correction'],
  ['v_errspot', 'verbal', 'Error spotting'],
  ['v_fill', 'verbal', 'Fill in the blanks'],
  ['v_parajumbles', 'verbal', 'Para jumbles'],
  ['v_sentcompl', 'verbal', 'Sentence completion'],
  ['v_rc', 'verbal', 'Reading comprehension'],
  ['v_critical', 'verbal', 'Critical reasoning'],
];

export const makeDefaultTopics = () =>
  DEFAULT_TOPICS.map(([id, section, name]) => ({ id, section, name, confidence: 3, notes: '', nextRevision: '' }));

// ---- helpers for special days ----
const rev = (section, label, topics) => ({ template: 'revision', section, label, topics });
const sect = (section, label) => ({ template: 'sectional', section, label });
const custom = (template, label) => ({ template, section: 'mixed', label });
const MIX = custom('mix', 'Mixed practice');

const ALL_VERBAL = DEFAULT_TOPICS.filter((t) => t[1] === 'verbal').map((t) => t[0]);

/**
 * exam: number of questions per section in that week's exam, and the target percentage.
 * phase: foundation | intermediate | advanced | revision
 */
export const CURRICULUM = [
  // ================= Weeks 1-4: Foundation =================
  {
    week: 1, phase: 'foundation', title: 'Getting started: numbers and series',
    focus: 'Build the number sense that every other quant topic depends on, and start daily vocabulary and pattern practice.',
    exam: { q: 15, l: 10, v: 10, pct: 55 },
    blocks: ['q_num', 'l_numseries', 'q_div', 'v_vocab', 'q_hcf', 'l_alpha'],
  },
  {
    week: 2, phase: 'foundation', title: 'Simplify, percent and patterns',
    focus: 'Speed up calculation with simplification and percentages, and learn the first verbal-reasoning patterns.',
    exam: { q: 15, l: 10, v: 10, pct: 55 },
    blocks: [['q_simp', 'q_frac'], 'l_analogy', 'v_pos', 'q_pct', 'l_class', 'l_coding'],
  },
  {
    week: 3, phase: 'foundation', title: 'Ratios, averages and relations',
    focus: 'Ratio, averages and basic algebra, with blood relations, direction sense and tenses.',
    exam: { q: 15, l: 10, v: 10, pct: 60 },
    blocks: ['q_ratio', 'v_tenses', 'q_avg', 'l_blood', 'q_algebra', 'l_direction'],
  },
  {
    week: 4, phase: 'foundation', title: 'Equations, language and checkpoint',
    focus: 'Equations, ranking, vocabulary and reading-comprehension basics, closing with a mixed practice day.',
    exam: { q: 15, l: 10, v: 10, pct: 60 },
    blocks: ['q_equations', ['v_syn', 'v_ant'], 'l_ranking', 'v_subverb', 'v_rc', MIX],
  },
  // ================= Weeks 5-8: Intermediate =================
  {
    week: 5, phase: 'intermediate', title: 'Money maths and logic rules',
    focus: 'Profit and loss, simple and compound interest, plus syllogisms, inequalities and sentence correction.',
    exam: { q: 20, l: 15, v: 15, pct: 65 },
    blocks: ['q_pl', 'l_syllogism', 'q_si', 'v_sentcorr', 'q_ci', 'l_inequal'],
  },
  {
    week: 6, phase: 'intermediate', title: 'Motion and diagrams',
    focus: 'Speed, trains and boats, with Venn diagrams, seating arrangements and error spotting.',
    exam: { q: 20, l: 15, v: 15, pct: 65 },
    blocks: ['q_tsd', 'l_venn', 'q_trains', 'v_errspot', 'q_boats', 'l_seating'],
  },
  {
    week: 7, phase: 'intermediate', title: 'Work, mixtures and arrangements',
    focus: 'Time and work, pipes, mixtures, linear arrangements, clocks and fill in the blanks.',
    exam: { q: 20, l: 15, v: 15, pct: 70 },
    blocks: ['q_tw', 'l_linear', 'q_pipes', 'v_fill', 'q_mixtures', 'l_clocks'],
  },
  {
    week: 8, phase: 'intermediate', title: 'Ages, calendars and language skills',
    focus: 'Ages, calendars, para jumbles, medium reading comprehension, idioms and one-word substitutions.',
    exam: { q: 20, l: 15, v: 15, pct: 70 },
    blocks: ['q_ages', 'l_cal', 'v_parajumbles', 'v_rc', ['v_onew', 'v_idioms'], MIX],
  },
  // ================= Weeks 9-10: Advanced =================
  {
    week: 9, phase: 'advanced', title: 'Counting, chance and puzzles',
    focus: 'Permutations and combinations, probability, circular arrangements, puzzles and advanced grammar.',
    exam: { q: 25, l: 20, v: 15, pct: 70 },
    blocks: ['q_pc', 'l_circ', 'q_prob', 'l_puz', ['q_prog', 'l_io'], ['v_artprep', 'v_sentcompl']],
  },
  {
    week: 10, phase: 'advanced', title: 'Geometry, data and critical thinking',
    focus: 'Geometry and mensuration, data interpretation, data sufficiency, statement-based reasoning and critical reasoning.',
    exam: { q: 25, l: 20, v: 15, pct: 75 },
    blocks: [['q_geo', 'q_mens'], ['l_sc', 'l_sa'], 'q_di', ['l_ds', 'l_cubes'], ['v_critical', 'v_rc'], MIX],
  },
  // ================= Weeks 11-12: Revision and exam practice =================
  {
    week: 11, phase: 'revision', title: 'Revision sprint',
    focus: 'Revise every quantitative, logical and verbal topic with mixed daily practice and mistake review.',
    exam: { q: 30, l: 25, v: 20, pct: 75 },
    blocks: [
      rev('quant', 'Quant revision I: number basics', ['q_num', 'q_div', 'q_hcf', 'q_simp', 'q_frac', 'q_pct', 'q_ratio', 'q_avg']),
      rev('quant', 'Quant revision II: applications', ['q_pl', 'q_si', 'q_ci', 'q_tsd', 'q_trains', 'q_boats', 'q_tw', 'q_pipes', 'q_mixtures', 'q_ages']),
      rev('quant', 'Quant revision III: advanced', ['q_algebra', 'q_equations', 'q_prog', 'q_pc', 'q_prob', 'q_geo', 'q_mens', 'q_di']),
      rev('logical', 'Logical revision I: patterns and verbal reasoning', ['l_numseries', 'l_alpha', 'l_analogy', 'l_class', 'l_coding', 'l_blood', 'l_direction', 'l_ranking', 'l_syllogism', 'l_inequal', 'l_venn']),
      rev('logical', 'Logical revision II: arrangements and puzzles', ['l_seating', 'l_linear', 'l_circ', 'l_puz', 'l_clocks', 'l_cal', 'l_cubes', 'l_ds', 'l_sc', 'l_sa', 'l_io']),
      rev('verbal', 'Verbal revision: grammar, vocabulary and comprehension', ALL_VERBAL),
    ],
  },
  {
    week: 12, phase: 'revision', title: 'Exam mode',
    focus: 'Timed sectional tests, a full-length aptitude test, speed drills and last-minute weak-topic practice.',
    exam: { q: 35, l: 30, v: 25, pct: 80 },
    blocks: [
      sect('quant', 'Timed sectional test: Quantitative'),
      sect('logical', 'Timed sectional test: Logical'),
      sect('verbal', 'Timed sectional test: Verbal'),
      custom('fulltest', 'Full-length aptitude test and analysis'),
      custom('weak', 'Final weak-topic practice'),
      custom('speed', 'Speed improvement and formula recap'),
    ],
  },
];

