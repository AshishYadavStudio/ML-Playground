// ============ Real-world examples — 2 per lesson ============
// Each: { icon, title, story, connection }
// story = 2–4 sentences painting a relatable everyday scene
// connection = one line tying it back to the lesson concept

export const EXAMPLES = {
  // ============================ FOUNDATIONS ============================
  intro: [
    {
      icon: '📺', title: 'Netflix knows what you\'ll click next',
      story: 'You watched three crime documentaries last weekend, and now Netflix\'s homepage is packed with true-crime shows you\'ve never heard of — but you actually like most of them. Nobody at Netflix hand-picked those for you. A model watched millions of "people who liked X also liked Y" patterns and predicted what would keep you glued to the screen.',
      connection: 'That model was never told the rules of taste — it learned them from raw viewing data. Rules from data → that\'s machine learning.',
    },
    {
      icon: '📧', title: 'Gmail sorts 300 billion emails a day',
      story: 'You almost never see spam anymore, and Gmail knew instinctively that the Nigerian-prince email was junk while the DHL delivery notice was real — even though both were from senders you\'d never met. Nobody programmed rules like "if it mentions inheritance, delete it."',
      connection: 'Gmail\'s filter learned "spammy" and "hammy" patterns from billions of user labels — the "flag as spam" clicks. Human answers in, learned rules out.',
    },
  ],
  'supervised-learning': [
    {
      icon: '🩺', title: 'A radiologist teaches an AI to spot cancer',
      story: 'A hospital shows the model 50,000 chest X-rays, each one labeled by an expert radiologist as "healthy" or "tumor present". After training, the model can flag suspicious spots on a fresh scan in seconds. The doctor still makes the call — but the AI never misses the subtle ones humans overlook after a long shift.',
      connection: 'Labeled examples (X-ray + expert answer) go in; a predictor comes out. That\'s supervised learning — classification, specifically.',
    },
    {
      icon: '💳', title: 'Your bank predicting your credit score',
      story: 'When you apply for a loan, the bank feeds your income, employment length, existing debts, and past payment history into a model. Out comes a number — 720, say — that estimates how reliably you\'ll repay. The model learned that number from millions of past customers whose repayment outcomes were already known.',
      connection: 'Real numeric answers (past customers\' actual defaults) trained the model to predict a number — regression, the other half of supervised learning.',
    },
  ],
  'unsupervised-learning': [
    {
      icon: '🎵', title: 'Spotify\'s Discover Weekly (nobody labeled these songs)',
      story: 'Every Monday, Spotify hands you 30 songs it thinks you\'ll love. Nobody at Spotify tagged those songs as "Ashish would like this" — the system just noticed that people with listening histories similar to yours also loved these tracks, and grouped everyone into invisible "taste clusters".',
      connection: 'No labels, no answers — just raw listening data grouped into hidden clusters. Textbook unsupervised learning.',
    },
    {
      icon: '🛒', title: 'Your credit card company spots a fraudulent charge',
      story: 'You use your card for coffee, groceries, and Netflix. Suddenly there\'s a $2,300 electronics purchase at 3 a.m. in Bangkok — and 40 seconds later your phone buzzes with a fraud alert. The bank\'s model wasn\'t told "these specific transactions are fraud"; it learned what your normal spending looks like and flagged this one as an outlier.',
      connection: 'Modeling "normal" and flagging outliers is anomaly detection — an unsupervised learning superpower.',
    },
  ],
  'reinforcement-learning': [
    {
      icon: '🎮', title: 'AlphaGo beats the world champion at Go',
      story: 'In 2016, an AI beat Lee Sedol at Go — a game with more possible board positions than atoms in the universe. Nobody programmed it with a "how to play Go" rulebook. It played against itself millions of times, getting +1 for every win and −1 for every loss, and slowly discovered strategies that even 3,000 years of human masters had never seen.',
      connection: 'No teacher, no dataset — just rewards and trial-and-error. That\'s reinforcement learning at its most dramatic.',
    },
    {
      icon: '🚗', title: 'A self-driving car learns to merge onto a highway',
      story: 'In simulation, a Waymo car practices highway merges millions of times. Smooth merge → reward. Sudden brake or close call → penalty. Over the training, the "policy" learns exactly how far ahead to look, when to accelerate, when to yield — no engineer wrote those rules by hand.',
      connection: 'The car learns from consequences — the essence of reinforcement learning.',
    },
  ],
  'data-features': [
    {
      icon: '🏠', title: 'Zillow trying to predict your house\'s price',
      story: 'Zillow feeds their model dozens of features per home: square footage, bedrooms, ZIP code, year built, school ratings, distance to a Starbucks. Square footage ranges 500–8000; year built ranges 1900–2024. Without scaling, "year" alone would drown out everything else just because its numbers happen to be bigger.',
      connection: 'Feature scaling puts every feature on equal footing — literally why Zillow\'s model even works.',
    },
    {
      icon: '📊', title: 'Splitting patient data for a COVID study',
      story: 'A researcher training a symptom-severity predictor sets aside 20% of patients and locks them in a drawer — they don\'t touch that data until the very end. Why? Because if the model ever "peeked" at those patients while training, the final accuracy number would be a lie, and doctors relying on it could be dangerously misled.',
      connection: 'The train/test split is the difference between "we think it works" and "we know it works." No shortcuts.',
    },
  ],
  'linear-regression': [
    {
      icon: '🍦', title: 'Ice cream sales rise with the temperature',
      story: 'A shop owner notices: on 60°F days she sells about 40 cones; on 90°F days, 130. She plots a year of data, draws a straight line through the dots, and can now predict tomorrow\'s sales from tomorrow\'s forecast.',
      connection: 'One input, one number out, a straight-line relationship — that\'s linear regression in its simplest form.',
    },
    {
      icon: '📈', title: 'How real estate agents estimate house prices',
      story: 'An agent doesn\'t guess your home\'s value out of thin air. Behind the scenes, a model weighs each feature: +$180 per square foot, +$25,000 per bathroom, −$8,000 for every mile from the city center. Add them up, land on a price. Those "per-foot" and "per-bathroom" numbers are the model\'s learned weights.',
      connection: 'Multiple inputs summed with learned weights = multi-feature linear regression. The workhorse of quick estimates everywhere.',
    },
  ],
  'gradient-descent': [
    {
      icon: '🏔️', title: 'Hiking down a mountain in thick fog',
      story: 'You\'re lost above the treeline, fog so thick you can\'t see 10 feet ahead, but you need to get to the valley below. So you feel with your foot which direction slopes down the steepest, take a careful step that way, then repeat. You have no map — just the slope right under you.',
      connection: 'That\'s gradient descent exactly: no global view, just local slope + small steps. Take too big a step and you fall off a cliff (diverge).',
    },
    {
      icon: '🎯', title: 'Adjusting the water temperature in the shower',
      story: 'Too cold → you nudge the knob toward hot. Too hot → nudge it back. Each little correction gets you closer to "just right", and if you overshoot wildly with a huge twist, you get scalded then frozen back and forth for a minute.',
      connection: 'Nudging based on the current error, in small steps — the exact algorithm training every neural network on Earth.',
    },
  ],
  overfitting: [
    {
      icon: '📚', title: 'The student who memorized every past exam',
      story: 'One kid crammed all five years of old exams — got 100% on every practice test. Another kid actually understood the underlying material. Come exam day, the questions were slightly different, and the memorizer bombed while the understander aced it. Sound familiar?',
      connection: 'Memorizing training answers = overfitting. High training score, awful test score. Real understanding generalizes; memorization doesn\'t.',
    },
    {
      icon: '🎨', title: 'A tailor who over-fits your suit',
      story: 'A great tailor makes a suit that fits perfectly today. A bad one makes it so tight it fits only the exact you at that exact weight — gain 2 pounds and you can\'t breathe, lose 2 and it drapes badly. Room to move ≠ sloppy fit; it means the suit works in situations slightly different from the measuring room.',
      connection: 'Regularization is the tailor leaving a little room. Perfect fit on training data usually means terrible fit on the real world.',
    },
  ],
  metrics: [
    {
      icon: '🦠', title: 'A COVID test\'s false-negative dilemma',
      story: 'Early in the pandemic, some rapid tests missed 30% of infected people (bad recall) while others accused healthy people of being sick (bad precision). Neither number alone tells the story — you need both, and which one matters more depends on whether missing a case or scaring a healthy person is worse.',
      connection: 'Precision vs recall is a trade-off, and the right balance depends on which mistake actually hurts. Accuracy alone hides the whole game.',
    },
    {
      icon: '🚨', title: 'Home security cameras and the "boy who cried wolf"',
      story: 'A cheap motion-detector camera that pings you every time a leaf blows by trains you to ignore its notifications — so when a real burglar comes, you swipe away the alert. Too many false alarms (low precision) is worse than useless: it destroys trust in the system.',
      connection: 'A "99% accurate" alarm that fires 200 times a day is worthless. This is why precision and F1 matter, not just accuracy.',
    },
  ],

  // ============================ PYTHON ============================
  'python-intro': [
    {
      icon: '📸', title: 'Instagram runs on Python',
      story: 'Every photo you scroll on Instagram — 500 million daily users — is served by a Python backend. When Instagram acquired Kevin Systrom\'s startup in 2012, they were already Python-first, and the language scaled with them from a two-person garage project to a Meta-scale product.',
      connection: 'Python isn\'t just for classrooms — it powers real apps at planetary scale. Learning it opens actual doors.',
    },
    {
      icon: '🔬', title: 'How NASA processes telescope images',
      story: 'The James Webb Space Telescope sends back raw sensor data from a million miles away. NASA scientists open Jupyter notebooks (Python), load the images with a few library calls, and manipulate 25-megapixel arrays as effortlessly as if they were tiny lists. What used to require a supercomputer team is now a one-person Python script.',
      connection: 'The Python ecosystem is the reason a single scientist can now do what a team once did.',
    },
  ],
  'python-variables': [
    {
      icon: '🛒', title: 'Your grocery-app cart is variables',
      story: 'When you tap "add to cart" on Zepto, somewhere on their server a variable literally holds `total_price = 340`. When you tap another item, that variable updates to 425. Refresh the page — the number persists because that variable is stored in a database, but the runtime concept is identical.',
      connection: 'Variables = named boxes holding values that change over time. Every counter, cart, and running total in every app is one.',
    },
    {
      icon: '🌡️', title: 'The thermostat on your wall',
      story: 'A smart thermostat like Nest has a variable `target_temp = 72`. Your phone updates it to 68 for the night. In the morning your routine bumps it to 70. Each change is `target_temp = new_value` — the same assignment operator you just learned.',
      connection: 'Reassigning a variable = updating one specific piece of state. Nothing more mysterious than that.',
    },
  ],
  'python-collections': [
    {
      icon: '🎧', title: 'Your Spotify playlist is a list',
      story: 'A playlist has an order (song 1, song 2, song 3…), and you can shuffle, add, remove, or reorder tracks. Spotify\'s app treats it as a list of song objects — <code>playlist.append(new_song)</code>, <code>playlist[0]</code>, exactly like the code you just wrote.',
      connection: 'Ordered, editable, indexed by position — that\'s a list, whether it\'s 5 items or 5 million.',
    },
    {
      icon: '📱', title: 'Your phone\'s contacts app is a dictionary',
      story: 'You never look up "the 47th contact" — you look up "Mom" and get her phone number. Behind the scenes: <code>contacts["Mom"] = "+91-98765-…"</code>. A dictionary maps keys (names) to values (numbers), with instant lookup regardless of size.',
      connection: 'Every name-to-thing lookup — usernames to accounts, product IDs to prices — is a dict.',
    },
  ],
  'python-control': [
    {
      icon: '🚦', title: 'A traffic light is one big if/elif/else',
      story: 'If pedestrian button pressed AND crosswalk clear → walk. Else if emergency vehicle approaching → all red. Else if timer > 45s → change lights. Every real-world control system, from elevators to microwaves, is a stack of these decisions running in a loop forever.',
      connection: 'if/elif/else = branching decisions. Loops = doing them again and again. Programs are decisions in loops.',
    },
    {
      icon: '💳', title: 'ATM PIN retry logic',
      story: 'An ATM lets you try your PIN three times. Attempt 1 wrong → try again. Attempt 2 wrong → warning. Attempt 3 wrong → card swallowed. That\'s a <code>for attempt in range(3):</code> with an <code>if</code> inside and a <code>break</code> on success. Real code, protecting real money.',
      connection: 'Loops with conditional break statements govern almost every real-world safety and retry mechanism.',
    },
  ],
  'python-functions': [
    {
      icon: '☕', title: 'A coffee vending machine is a function',
      story: 'You pick a drink (cappuccino), put in the sugar level (2), press GO. Inside: <code>make_drink(type="cappuccino", sugar=2)</code>. Coffee comes out. You don\'t care about the internal grinding, steaming, or dispensing — just the inputs you gave and the output you got.',
      connection: 'Every function hides complexity behind a name + inputs + output. Reuse without rewriting.',
    },
    {
      icon: '📱', title: 'The "Send" button in WhatsApp',
      story: 'When you type a message and hit Send, WhatsApp calls something like <code>send_message(text=…, to=…, encrypt=True)</code>. That one call fans out into hundreds of internal steps — but as a user (and as the button\'s coder), you only think in terms of the inputs and the sent-checkmark output.',
      connection: 'Functions let a whole engineering team compose gigantic systems from small, testable pieces.',
    },
  ],
  'python-basics': [
    {
      icon: '🔍', title: 'A chef reviewing their recipe step by step',
      story: 'When a new dish fails, a chef mentally walks each step: "I heated the oil to 180°C — check. I added the onions — check. Did I really add salt or just think about it?" That mental step-through is exactly what a debugger (or this lesson\'s tracer) does with code.',
      connection: 'Line-by-line reading is how professionals actually debug real programs. This lesson taught you the skill in miniature.',
    },
    {
      icon: '📝', title: 'Following an IKEA instruction manual',
      story: 'Page 3, step 7: "Insert peg A into hole B." You do exactly that, then step 8. Skip a step and the whole shelf collapses. Debugging code is checking, one step at a time, that reality matches the instructions.',
      connection: 'The variable panel in this lesson mirrors what any professional keeps in their head or their debugger: what\'s in each box, right now.',
    },
  ],
  'python-advanced': [
    {
      icon: '🏭', title: 'A factory assembly line is a comprehension',
      story: 'Raw parts enter one end; each station transforms them (drill, paint, inspect); finished products exit the other end. A defective part gets removed at inspection — it\'s filtered out. That\'s the exact mental model of <code>[paint(drill(p)) for p in parts if not defective(p)]</code>.',
      connection: 'Comprehensions are assembly lines for data — pipeline in, transformed batch out, in one readable line.',
    },
    {
      icon: '🗂️', title: 'Your smartphone\'s calendar is a class',
      story: 'Every "event" on your calendar has a start time, end time, title, location, guests list — bundled together — plus behaviors: reminders, RSVPs, moving the event. That bundle-of-data-plus-behavior is exactly what a class is. Ten calendar events = ten instances of the Event class, each with its own values.',
      connection: 'Classes = one blueprint, many instances. Your Facebook posts, Uber rides, and Slack messages are all instances of classes somewhere.',
    },
  ],
  numpy: [
    {
      icon: '🖼️', title: 'Editing a photo on Instagram',
      story: 'When you slide the "brightness" bar, Instagram doesn\'t loop through your image\'s 2 million pixels one at a time — that would take seconds and make the app feel broken. It multiplies the entire pixel array by a single number at once. What NumPy does in one line, a plain loop would do 2 million times.',
      connection: 'Instagram (and every photo app) works in real time only because vectorized math is 100–1000× faster than looping.',
    },
    {
      icon: '🌦️', title: 'Weather models crunching global grids',
      story: 'Weather forecasts divide the atmosphere into a grid of billions of cells and compute pressure, wind, temperature at each — every 15 minutes. A Python loop would take days per forecast. NumPy-style vectorized math (running on specialized hardware) does it in minutes.',
      connection: 'Any time you see "real-time" or "big data" in a headline, vectorization is what made it possible.',
    },
  ],
  pandas: [
    {
      icon: '📊', title: 'A retail analyst finds the store\'s bestseller',
      story: 'A Big Bazaar analyst pulls a CSV of last week\'s 2 million transactions. In three pandas lines — read the file, group by product, sort by total revenue — she finds the top 10 products by store. In Excel this would freeze her laptop; pandas returns in a second.',
      connection: 'pandas is Excel for people who\'ve outgrown Excel — the industry-standard way to slice, aggregate, and clean tabular data.',
    },
    {
      icon: '🎬', title: 'Netflix cleaning subscriber data',
      story: 'When you cancel Netflix at 11pm and re-subscribe at 6am, their systems see two "churn events" in one row. Data engineers use pandas to detect and merge these fake events across billions of records before analysts look at retention numbers.',
      connection: 'Every clean dashboard you\'ve ever seen started as messy data cleaned up in pandas (or something like it).',
    },
  ],
  dataviz: [
    {
      icon: '🌍', title: 'The COVID-19 dashboards that ran the world',
      story: 'For two years, half the planet checked Johns Hopkins\' COVID dashboard daily. That dashboard\'s power wasn\'t the raw numbers — it was the charts: line graphs showing curves flattening, maps showing hotspots. Presidents made lockdown decisions from those visuals.',
      connection: 'A well-chosen chart transmits understanding faster than any table of numbers. Sometimes it literally changes policy.',
    },
    {
      icon: '🗳️', title: 'Election-night maps on your TV',
      story: 'On election night the anchor shifts to a map: red states, blue states, county-level shading, exit-poll bars. Behind the scenes, statisticians are wrangling thousands of precinct results in real time — and choosing exactly which chart type answers "who\'s winning" fastest.',
      connection: 'The right visualization at the right time is worth a thousand spreadsheets.',
    },
  ],
  'ml-code': [
    {
      icon: '🧑‍🍳', title: 'The IKEA effect for ML engineers',
      story: 'Every ML engineer\'s first project follows the same three lines: import a library, load a dataset, call fit. It feels magical — you built a spam filter in 15 lines! That "hello world" moment is what pulls people into ML careers, and it\'s exactly the workflow you just walked through.',
      connection: 'The scikit-learn / PyTorch APIs are so uniform that everyone\'s first real ML script looks like everyone else\'s. That\'s a feature, not a bug.',
    },
    {
      icon: '🏥', title: 'Hospitals deploying diagnostic AI in a weekend',
      story: 'A radiology group with an idea for a fracture-detector doesn\'t hire a team of ML PhDs. Two junior engineers use scikit-learn / PyTorch, follow the exact workflow you saw, and have a prototype by Monday morning. The concepts are hard; the code, thanks to good libraries, is short.',
      connection: 'The reason ML has spread so fast is that the libraries turn a research paper into 30 lines any engineer can read.',
    },
  ],

  // ============================ CLASSICAL ML ============================
  'logistic-regression': [
    {
      icon: '📧', title: 'Gmail\'s spam filter — a logistic regression under the hood',
      story: 'Every time you hit "Report Spam", Gmail\'s model updates the weights of maybe 100,000 words. Words like "viagra" get a big positive weight (spam-y); words like "meeting" get negative (hammy). Sum them up for a new email, run it through sigmoid, and you get a probability of spam. Simple, decades old, still world-class.',
      connection: 'Logistic regression is the workhorse behind billions of daily spam decisions. Not glamorous — just relentless.',
    },
    {
      icon: '🏦', title: 'A bank predicting loan default',
      story: 'The bank\'s model takes income, existing debt, credit history — outputs a probability like "78% likely to repay". Above 70%, loan approved; below, denied. That threshold isn\'t magic; it\'s a business decision reflecting how much default risk the bank tolerates.',
      connection: 'The model gives a probability; humans pick the threshold based on what a mistake costs. This split of labor is at the heart of applied ML.',
    },
  ],
  knn: [
    {
      icon: '🍕', title: 'Finding a good restaurant in a new city',
      story: 'You land in a city you\'ve never visited. You open Yelp, filter to "5-star restaurants within 500m of me", and pick the top-reviewed. You\'ve just done KNN by hand: nearest neighbors + majority vote, no training required.',
      connection: 'KNN is how people naturally solve "what should I do here?" problems. It just requires no algorithm class to explain.',
    },
    {
      icon: '📸', title: 'iPhone\'s "similar photos" feature',
      story: 'You search "beach" in your Photos app. iOS finds every photo whose learned embedding is closest to your query — literally nearest neighbors in high-dimensional space. Same algorithm you just used on a 2D scatter plot; just with 512-dimensional vectors and a million photos.',
      connection: 'When the "distance" is meaningful (learned embeddings), KNN scales from a toy demo to a phone-scale search engine.',
    },
  ],
  svm: [
    {
      icon: '🎯', title: 'Face recognition on your camera roll',
      story: 'When your phone\'s Photos app labels a face as your daughter, older systems used SVMs — draw the widest possible margin between "daughter" and "not daughter" in feature space. Modern systems moved to neural nets, but SVMs still ran the show through the 2000s and are still used for smaller datasets where they\'re hard to beat.',
      connection: 'The "widest margin" idea — leaving safety room between classes — was the state-of-the-art in vision until deep learning took over.',
    },
    {
      icon: '📊', title: 'Kaggle competitions before deep learning',
      story: 'Between 2010 and 2015, a huge number of ML competitions were won by SVM ensembles. The kernel trick let a modest desktop find nonlinear boundaries that a neural net of the era couldn\'t. Even today, for datasets under a few thousand rows, an SVM is often the smart first move.',
      connection: 'Bigger, fancier isn\'t always better. On small tabular data, SVMs still frequently beat 100-layer neural nets.',
    },
  ],
  'naive-bayes': [
    {
      icon: '📨', title: 'The very first spam filters',
      story: 'In 2002 Paul Graham published "A Plan for Spam" — a Naive Bayes filter written in a weekend that cut his spam by 99%. Within months, every email client on Earth had a Naive Bayes filter built in. Two decades later, it\'s still the baseline every spam detector is compared against.',
      connection: 'Sometimes the "naive" algorithm from 2002 quietly outperforms the fancy 2024 one — because in classification, simple often wins.',
    },
    {
      icon: '🩺', title: 'A doctor diagnosing a rare disease',
      story: 'A patient has three symptoms; the doctor mentally weighs "how often do people with disease X have these symptoms?" vs "how often do healthy people?" and picks the more likely explanation. That\'s Bayes\' theorem in a stethoscope — updating a prior with new evidence.',
      connection: 'Diagnosis is applied Bayes\' theorem, whether the doctor knows it or not. Naive Bayes automates that logic for computers.',
    },
  ],
  'decision-trees': [
    {
      icon: '🏥', title: 'Insurance approval — a giant flowchart',
      story: 'When you apply for health insurance, a decision tree asks: age > 55? Yes → smoker? No → previous claims > 3? … Each yes/no branch narrows down what premium (or refusal) you\'ll get. The advantage: a regulator can inspect every branch and demand justification. Try that with a neural net.',
      connection: 'When regulators, doctors, or auditors need to see the exact reasoning, trees beat black-box models every time.',
    },
    {
      icon: '🏆', title: 'How Kaggle-winning solutions look today',
      story: 'Open the winning solution of most tabular Kaggle competitions (loan defaults, click predictions, insurance fraud) and you\'ll find XGBoost or LightGBM — gradient-boosted trees. Not transformers. Not deep learning. Just a lot of small trees, each correcting the last.',
      connection: 'For tabular data, tree ensembles quietly rule the world. Deep learning\'s dominance is real, but tabular is still trees\' turf.',
    },
  ],
  kmeans: [
    {
      icon: '👥', title: 'Marketing segments at a supermarket chain',
      story: 'DMart runs K-Means on 20 million customers using features like average basket size, visit frequency, weekend vs weekday shopping. Out come clusters: "young singles buying ready meals", "big families buying bulk", "elderly early-birds". Each cluster gets its own targeted coupon.',
      connection: 'Every "targeted email" you get is because a K-Means-like model put you in a specific cluster.',
    },
    {
      icon: '🎨', title: 'How JPEGs compress your photos',
      story: 'A photo has millions of unique colors. JPEG runs K-Means to find (say) 256 representative colors, then stores each pixel as an index into that palette. Ten-fold compression, imperceptible quality loss. K-Means is why your camera roll fits on your phone.',
      connection: 'K-Means quietly powers image compression on every device you own.',
    },
  ],
  pca: [
    {
      icon: '👤', title: '"Eigenfaces" — the OG face recognition',
      story: 'A 200×200 photo has 40,000 pixels — way too many for a 1990s computer. PCA showed that most face variation lives on ~100 "eigenface" axes: brow shape, jaw width, lighting angle, and so on. Compress a face to 100 numbers and you can recognize it in a database of millions.',
      connection: 'PCA turned face recognition from "impossibly expensive" to "runs on a Pentium" — the same trick still runs in 2024.',
    },
    {
      icon: '🧬', title: 'Genetics research — reducing 20,000 genes to 2 dimensions',
      story: 'A researcher measures the activity of 20,000 genes across 500 patients. PCA squeezes those 20,000 dimensions down to a 2D scatter plot where suddenly you can see: cancerous patients cluster in the top right, healthy in the bottom left. Twenty thousand → two.',
      connection: 'PCA is the reason we can visualize genetic, financial, and word-embedding data that no human could imagine in raw form.',
    },
  ],

  // ============================ DEEP LEARNING ============================
  'neural-networks': [
    {
      icon: '📱', title: 'Face ID unlocking your iPhone in 0.4 seconds',
      story: 'You lift your phone; a neural network with millions of weights ingests the infrared depth map of your face, decides you\'re you (not your sibling, not a photo), and unlocks. All of it happens on the phone\'s A17 chip — no server, no internet, no delay.',
      connection: 'The tiny playground network you just trained is the exact same architecture — Face ID just has more layers and more training data.',
    },
    {
      icon: '🌾', title: 'A farmer\'s app that spots crop disease from a photo',
      story: 'A farmer in Punjab photographs a wilting leaf. An app on his cheap phone runs a small neural net and says "early blight, 87% confident, spray copper fungicide". Nobody wrote the "if brown-yellow with dry edges" rule. The net learned it from 50,000 labeled leaves.',
      connection: 'Neural nets shine wherever the rule "what makes this look diseased?" is easier to show than to explain in words.',
    },
  ],
  activations: [
    {
      icon: '💡', title: 'A single neuron firing in your brain',
      story: 'Real neurons don\'t fire proportionally to input. Below a threshold — silence. Above it — they fire. That threshold behavior is what ReLU imitates: near zero → zero, above zero → linear. The design principle is directly inspired by biology.',
      connection: 'Every "spike" pattern you\'ve heard about in neuroscience is analogous to what an activation function does in an artificial network.',
    },
    {
      icon: '📉', title: 'Why deep learning was stuck in the 1990s',
      story: 'The vanishing-gradient problem you saw isn\'t academic history — it\'s literally why neural nets went dormant for 15 years. Everyone had the architecture; nobody could train the deep versions. When ReLU was popularized around 2011, the "AI winter" ended within two years.',
      connection: 'The choice of activation function delayed the deep-learning revolution by a decade. One little function shape mattered that much.',
    },
  ],
  backprop: [
    {
      icon: '📝', title: 'How you learn from a graded exam',
      story: 'You get your exam back with red marks. You look at question 3 you got wrong, trace back — "I chose C because I confused the definitions" — and adjust your studying accordingly. Each red mark contributes a specific correction. That backward flow, from result to specific fix, is backprop.',
      connection: 'Learning from mistakes = propagating error backward = the exact algorithm the network runs.',
    },
    {
      icon: '🏭', title: 'Assembly-line quality control',
      story: 'A car rolls off the line with a paint defect. Managers walk backward through the process — was it the primer? The spray nozzle pressure? The dryer? — assigning some blame to each station based on how much it contributed. Backprop assigns exactly that kind of "blame" to each weight in the network.',
      connection: 'Debugging by tracing an error backward through a pipeline is a universal human strategy. Backprop just automates it with calculus.',
    },
  ],
  optimizers: [
    {
      icon: '🗺️', title: 'Google Maps recalculating your route',
      story: 'You miss an exit. Google Maps doesn\'t restart your journey — it looks at where you are, where you\'re going, and takes the best next step. If traffic is heavy on one road, it "weights" that direction less. Momentum, adaptive steps, learning-rate schedules — all show up in path-planning tech.',
      connection: 'Optimization is everywhere: routing, delivery, factory scheduling. The tricks that speed up neural-net training show up in all of them.',
    },
    {
      icon: '💰', title: 'How Adam changed everything',
      story: 'Before Adam (2014), training big neural nets took weeks and required constant hand-tuning of learning rates. Adam made "just run it and it works" almost the norm. Within a year, virtually every ML researcher on Earth had switched to it. The paper has 200,000+ citations.',
      connection: 'A single optimizer choice reshaped an industry\'s productivity. Small algorithmic tweaks have giant real-world ripples.',
    },
  ],

  // ============================ ADVANCED ============================
  cnn: [
    {
      icon: '📸', title: 'iPhone Portrait Mode blurring the background',
      story: 'Point an iPhone at a person; the background blurs like an expensive DSLR. Behind the scenes, a CNN segments the image pixel-by-pixel — "this is a person, this is background, this is hair" — in real time. No depth-sensor magic, mostly a CNN trained on millions of photos.',
      connection: 'Every "smart" photo effect on your phone — portrait mode, night mode, object removal — is a CNN under the hood.',
    },
    {
      icon: '🩻', title: 'CNN spots diabetic retinopathy from an eye photo',
      story: 'A 2018 Google model, from a single eye photograph, detected diabetic retinopathy as accurately as specialists — a condition that goes untreated in millions because there aren\'t enough retinal specialists. Cheap smartphone camera + a CNN = accessible screening.',
      connection: 'CNNs bring specialist-grade vision to places specialists can\'t reach. The healthcare implications are massive.',
    },
  ],
  rnn: [
    {
      icon: '⌨️', title: 'Autocomplete on your phone keyboard',
      story: 'You type "How are y" and your keyboard suggests "you". That prediction used an RNN (or LSTM) for years — each word feeding into a hidden state that carried the meaning of your sentence forward. Only in the last few years did transformers replace RNNs in the fanciest keyboards.',
      connection: 'RNNs dominated language processing for the whole 2010s. Every "smart" text feature you used before 2020 was probably one.',
    },
    {
      icon: '🎼', title: 'AI music generation, one note at a time',
      story: 'Early neural music generators (like Google\'s Magenta) used LSTMs — given the past 10 notes, predict the next one. Repeat 1000 times, and you have a symphony that has never existed before. The "context of what came before" is exactly what a hidden state carries.',
      connection: 'Anything sequence-shaped — text, music, video, stock prices — was an RNN\'s territory for a decade.',
    },
  ],
  transformers: [
    {
      icon: '💬', title: 'ChatGPT reading your prompt',
      story: 'When you send a 500-word prompt to ChatGPT, its transformer looks at every word in relation to every other word simultaneously — deciding which past words are relevant to interpreting each new one. That "everything attends to everything" trick is the entire reason the model can hold a coherent conversation.',
      connection: 'The transformer is the architecture powering every major AI product of the 2020s. Not just LLMs — image models, protein folding, code generators.',
    },
    {
      icon: '🌐', title: 'Google Translate rewritten in 2016',
      story: 'Between 2014 and 2018 Google secretly replaced their translation engine with a transformer-based system. Overnight, translation quality jumped decades — sentences that used to read as robotic soup started to sound human. The same architecture now underlies every serious translation product on Earth.',
      connection: 'Google Translate\'s pre-2016 quality vs today\'s is the clearest before/after showcase of what transformers unlocked.',
    },
  ],
  embeddings: [
    {
      icon: '🛍️', title: 'Amazon\'s "customers also bought" recommendations',
      story: 'You buy a yoga mat. Below it: "Customers also bought" a foam roller, a resistance band, a water bottle. Amazon represents every product as a 128-dimensional vector, and finds nearest neighbors to your purchase. Products the model has never explicitly been told are "related" show up because their vectors are close.',
      connection: 'Every "similar items", "related videos", "songs like this" widget on the internet is embedding-based nearest-neighbor lookup.',
    },
    {
      icon: '🎨', title: 'DALL·E turning "an astronaut riding a horse" into an image',
      story: 'DALL·E doesn\'t have a giant image dictionary keyed on text. It has a shared embedding space where the phrase "astronaut riding a horse" and pixel-level pictures of that scene sit near each other. That shared space is why you can type nonsense combinations and get plausible images.',
      connection: 'Text-to-image only works because embeddings translate meaning across modalities — text vectors and image vectors literally share a coordinate system.',
    },
  ],
  generative: [
    {
      icon: '🎨', title: 'Midjourney, DALL·E, Stable Diffusion generating art from words',
      story: 'You type "a raccoon in a Renaissance oil painting" and 4 seconds later — a beautiful painting exists that never did before. Under the hood: a diffusion model gradually removes noise from pure static, guided at each step toward your text prompt. Multiply this by 10 million users a day and you get the current AI-art industry.',
      connection: 'Every image you\'ve seen labeled "AI-generated" in 2023–2024 came from a diffusion model, using the exact denoising process you played with.',
    },
    {
      icon: '👤', title: 'ThisPersonDoesNotExist.com',
      story: 'You refresh the page and see a completely realistic photo of a person who has never existed. Every pixel invented by a GAN — one network generating faces, another trying to spot the fakes. After 4 years of training, the generator wins. Zoom in on the earrings; they usually don\'t match.',
      connection: 'GANs proved that neural nets could invent, not just recognize. That leap opened the door to the entire generative-AI era.',
    },
  ],
  llms: [
    {
      icon: '🤖', title: 'ChatGPT hits 100 million users in 2 months',
      story: 'Late 2022: ChatGPT is released. Faster than any app in history, it reaches 100 million monthly users — beating TikTok\'s previous record. The core mechanism you saw in the demo (predict-the-next-token, sample, repeat) is exactly what runs when you ask it to write your resume.',
      connection: 'The autoregressive next-token loop you just watched is what generated the "wow, this feels human" moment for billions of people.',
    },
    {
      icon: '💼', title: 'The doctor who uses Claude to draft patient notes',
      story: 'A doctor sees 30 patients a day. Between them, she dictates the visit to Claude, which drafts a clinical note formatted for the hospital\'s EHR. She reviews and signs. What used to take her 3 hours after clinic now takes 30 minutes. Her charting is faster; her family gets her back at 6pm.',
      connection: 'Every profession is quietly rewriting itself around LLMs. The Foundations chapter you completed is the mental model needed to work with (or on) them.',
    },
  ],
  'ensemble-methods': [
    {
      icon: '🏆', title: 'Every Kaggle winner for a decade',
      story: 'Look at the top-3 solutions of almost any Kaggle competition on tabular data since 2015 — home prices, credit defaults, click-through rates. Nine times out of ten the winning approach is a XGBoost or LightGBM ensemble, sometimes stacked with a second layer of even more boosted trees. Not neural networks. Not fancy AutoML. Just hundreds of shallow trees stacked cleverly.',
      connection: 'One tree is weak. Hundreds trained on each other\'s mistakes wins competitions — that\'s the entire pitch of boosting.',
    },
    {
      icon: '💳', title: 'Fraud detection at your bank',
      story: 'When a transaction comes in, the bank\'s system runs it through a Random Forest of hundreds of decision trees, each trained on a different slice of past fraud cases. Any single tree could be wrong or biased, but the majority vote across all of them is stable, fast, and accurate enough to flag or block in under 200 milliseconds.',
      connection: 'Bagging tames unstable models by averaging out their idiosyncrasies. Random Forest is the industrial workhorse behind millions of daily fraud decisions.',
    },
  ],
  'cross-validation': [
    {
      icon: '🍞', title: 'A baker perfecting a new sourdough recipe',
      story: 'A baker doesn\'t judge a recipe from one loaf — they bake it five times over a week, at different times of day, and average the results. One perfect loaf could just be a lucky oven day; five decent loaves means the recipe genuinely works.',
      connection: 'One train/test split is one loaf. K-fold cross-validation is the whole week — the average tells you what to trust.',
    },
    {
      icon: '📊', title: 'A/B testing that isn\'t fooled by a lucky week',
      story: 'A product team tests a new checkout button. Week 1 shows +12% conversion — champagne! But they don\'t ship: they wait five more weeks and see +4%, -2%, +8%, +1%, +3%. The real effect is closer to +4% ± 5%, and the "amazing" +12% was noise.',
      connection: 'Same problem, same fix: measure several times, average the score, watch the spread. Cross-validation is the ML flavor of exactly this discipline.',
    },
  ],
  'bayes-theorem': [
    {
      icon: '🩻', title: 'Why a "99% accurate" cancer screen can still be wrong',
      story: 'A new blood test claims 99% accuracy for a cancer that affects 1 in 1,000 people. You test positive. Most doctors\' intuition says "I probably have cancer." Bayes\' theorem says: only about 9%. The false-positive rate multiplied by the huge healthy population drowns the tiny true-positive count.',
      connection: 'Prior × Likelihood = Posterior. Without knowing how rare the disease is, no test accuracy makes sense.',
    },
    {
      icon: '🕵️', title: 'The spam filter working in your inbox right now',
      story: 'Gmail\'s classic filter tallies each word\'s frequency in past spam vs past ham. When a new email arrives, it multiplies all the word likelihoods with a "spam prior" and computes P(spam | email). "Viagra" pushes the probability way up; "meeting" pulls it back down.',
      connection: 'That\'s literally Naive Bayes — Bayes\' theorem with the naive assumption that word occurrences are independent. Simple, fast, still shockingly effective.',
    },
  ],
  'feature-engineering': [
    {
      icon: '🏠', title: 'How Kaggle grand-masters win house-price contests',
      story: 'The raw dataset says the house has 3 bedrooms and 2000 sq ft. But the top-scoring notebooks always add derived features: price-per-sqft comparables, distance to top schools, log-transformed lot size, whether the sale month was peak season, interaction between neighborhood and bedroom count. The model is the same LightGBM everyone else runs — the feature list is what wins.',
      connection: 'Better features > fancier models. Domain knowledge encoded as columns is where the accuracy actually comes from.',
    },
    {
      icon: '⏰', title: 'Uber knowing surge pricing before you request the ride',
      story: 'Uber\'s pricing model doesn\'t see just the raw timestamp of your request. It sees sin/cos-encoded hour-of-day, day-of-week, distance to nearest concert venue, average recent driver density, weather forecast, and dozens of similar hand-crafted features. Each one lets the model learn a specific pattern it couldn\'t see from raw fields alone.',
      connection: 'Datetime engineering, geo distances, aggregates, interactions — all the moves this lesson covers, in a shipping product touching millions of rides an hour.',
    },
  ],
  'autoencoders': [
    {
      icon: '📸', title: 'JPEG compression, but learned',
      story: 'JPEG shrinks a photo by throwing away detail humans barely notice. A neural autoencoder does the same trick — but the "throw away" rules aren\'t hand-designed by a 1992 committee, they\'re learned from millions of specific images. Trained on faces, it compresses faces beautifully; trained on medical scans, it keeps the diagnostically-important pixels sharp.',
      connection: 'The bottleneck is the compression ratio. Encoder = zip, decoder = unzip, learned end-to-end.',
    },
    {
      icon: '🚨', title: 'A factory catching defective products it\'s never seen',
      story: 'A soft-drink line trains an autoencoder on 10,000 photos of perfect bottles. In production, if a bottle photo reconstructs poorly (high error), it\'s flagged for a human — even if the defect is a type nobody labeled. Missing cap, off-center label, chipped glass all show up as high reconstruction error.',
      connection: 'Anomaly detection via reconstruction error — one of the most reliable industrial uses of unsupervised deep learning.',
    },
  ],
  'diffusion': [
    {
      icon: '🎨', title: 'DALL·E and Midjourney turning "a corgi astronaut" into pixels',
      story: 'You type a wild prompt and 10 seconds later a photorealistic corgi in a spacesuit appears. Under the hood, the system starts with a canvas of pure random noise, then a network trained on billions of image-caption pairs subtracts predicted noise 30–50 times, each step nudging the noise toward "things captioned like your prompt." The corgi materializes.',
      connection: 'That\'s diffusion in production. The T-step reverse denoising you saw is literally this process, just with the noise-predictor trained on internet-scale data.',
    },
    {
      icon: '🎵', title: 'Music and video generators using the same trick',
      story: 'OpenAI\'s Sora generates minute-long HD video from text. Suno makes original songs from a prompt. Both use the same "learn to reverse noise" recipe as image diffusion — just applied to different data (video tensors, audio spectrograms). The neural network changes; the mechanism is identical.',
      connection: 'Diffusion isn\'t image-specific. Any high-dimensional continuous data can be corrupted with noise and taught to be reversed. That\'s why 2023-2025 saw an explosion in generative media.',
    },
  ],
  'fine-tuning': [
    {
      icon: '⚖️', title: 'A law firm\'s in-house LLM assistant',
      story: 'A boutique firm can\'t train a foundation model — but they can spend $200 of GPU time to LoRA-fine-tune Llama 3 on 5,000 anonymized past briefs. The result: an assistant that writes in their house style, cites the case types they actually litigate, and uses their firm\'s section-numbering conventions. A general-purpose LLM sounded like a college student; the fine-tuned one sounds like their senior associates.',
      connection: 'LoRA touches ~1% of parameters — enough to teach style and format without wiping out the base model\'s general knowledge.',
    },
    {
      icon: '🎮', title: 'Open-source model hubs full of hobbyist LoRAs',
      story: 'Browse Hugging Face and you\'ll find thousands of LoRA adapters for Stable Diffusion and Llama — each one a few megabytes trained by one person over a weekend on a gaming GPU. "Wes Anderson style", "medical terminology assistant", "SQL-only responses". You download the tiny adapter, layer it on top of the base model, and get a specialized model without downloading a whole new one.',
      connection: 'Hot-swappable specializations. LoRA turned model customization into a community craft, not a corporate-only capability.',
    },
  ],
  'rag': [
    {
      icon: '💼', title: 'Every corporate "chat with our docs" tool built since 2023',
      story: 'A company gives their support team an AI chat that answers questions from the internal wiki, product manuals, and past ticket resolutions. The LLM was never trained on any of it — instead, at each question, an embedding lookup finds the top-3 relevant snippets and feeds them into the prompt. When a policy changes, they re-embed one document; the assistant is instantly up-to-date.',
      connection: 'That\'s RAG. Fresh knowledge, no retraining, native citations. It\'s the default architecture for enterprise LLM apps.',
    },
    {
      icon: '⚖️', title: 'Perplexity, You.com, and every "AI search" product',
      story: 'You ask a question about last night\'s election result. A conventional LLM would either refuse ("my training cut off") or hallucinate. A RAG-powered search engine hits a fresh web index, retrieves the top articles, and hands them to the LLM as context. The answer arrives with clickable citations — often less than a second later.',
      connection: 'RAG turned LLMs from static knowledge bases into live-web reasoners. Same trick, planet-scale index.',
    },
  ],
};
