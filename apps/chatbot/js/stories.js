/**
 * Kids Storytelling & Comprehension Quiz Engine
 * Features engaging children's stories with moral values, interactive comprehension questions,
 * voice response validation, appreciation notes, and listening improvement badges.
 */

class KidsStoryEngine {
  constructor() {
    this.currentActiveQuiz = null; // Stores story currently being tested

    this.stories = [
      {
        id: 'story-sea-turtle',
        title: "Kavi the Brave Little Sea Turtle",
        emoji: "🐢🌊",
        category: "Courage & Kindness",
        duration: "2-3 Mins",
        summary: "Kavi embarks on his first ocean adventure and helps a trapped starfish find its way home.",
        content: `Once upon a time, on the golden sands of a sunny beach, lived a tiny sea turtle named Kavi. Kavi had shiny emerald flippers and big curious eyes. Today was the most exciting day of his life: his very first swim in the great blue ocean!

As Kavi splashed into the crystal clear water, the gentle waves carried him along. The underwater world was full of colors—bright pink coral reefs, dancing clownfish, and swaying seaweeds. 

Suddenly, Kavi heard a quiet cry behind a large shell. "Help! I'm stuck!" cried a little golden starfish named Tara. A drifting piece of seaweed had wrapped around her arm.

Even though Kavi was eager to swim forward, he remembered what his wise grandmother had told him: *'True strength is helping someone in need.'*

Kavi carefully used his smooth beak to loosen the seaweed knot. With a gentle tug, Tara was free! "Thank you, Kavi! You are so brave and kind," cheered Tara. 

To thank him, Tara showed Kavi a magical shortcut through the coral garden where the warm ocean current danced like music. Kavi swam happily, knowing that kindness always brings the sweetest rewards.`,
        moral: "Kindness and helping others make any journey magical.",
        quiz: {
          question: "Who did Kavi help in the ocean, and what was her name?",
          targetKeywords: ["tara", "starfish", "golden starfish", "star fish", "little starfish"],
          acceptableDetails: ["stuck in seaweed", "helped free her", "untangled seaweed"],
          funFact: "Did you know? Sea turtles have lived in our oceans for over 100 million years!"
        }
      },
      {
        id: 'story-sammy-squirrel',
        title: "Sammy and the Sparkling Golden Acorn",
        emoji: "🐿️✨",
        category: "Sharing & Friendship",
        duration: "2 Mins",
        summary: "Sammy discovers a rare golden acorn and learns that joy doubles when shared.",
        content: `In the heart of the Whispering Woods, Sammy the squirrel was the fastest acorn collector. One crisp autumn morning, high up on the ancient Oak Tree, Sammy spotted something dazzling—a rare, glowing Golden Acorn!

"Wow! This is the most special acorn in the entire forest!" gasped Sammy. At first, Sammy wanted to hide it deep inside his secret tree hollow so nobody else could see it.

Later that afternoon, Sammy saw his best friend Bella the bluebird shivering on a chilly branch, and Oliver the rabbit looking tired from gathering berries. 

Sammy looked at the glowing golden acorn. He realized that hiding it made him feel lonely. So, Sammy called all his forest friends together beneath the Great Oak. 

"Look what I found! Let's celebrate our autumn feast together!" smiled Sammy. The golden acorn glowed so brightly that it warmed the whole clearing, filling everyone's hearts with joy and laughter. Sammy realized that sharing with friends is the greatest treasure of all.`,
        moral: "Sharing your treasures with friends brings the truest happiness.",
        quiz: {
          question: "What special treasure did Sammy find in the ancient Oak Tree, and what did he decide to do with it?",
          targetKeywords: ["golden acorn", "acorn", "sparkling acorn", "shared", "shared with friends", "autumn feast"],
          acceptableDetails: ["invited bella and oliver", "did not hide it", "celebrated together"],
          funFact: "Did you know? Squirrels plant thousands of trees every year because they hide acorns and forget where they put them!"
        }
      },
      {
        id: 'story-little-star',
        title: "Pip the Star Who Learned to Shine",
        emoji: "⭐🌙",
        category: "Self-Confidence & Perseverance",
        duration: "2 Mins",
        summary: "Pip feels too small to light up the night sky until a lost puppy needs his gentle sparkle.",
        content: `High above the fluffy night clouds lived Pip, the smallest star in the galaxy. While the giant stars shone with booming blue and silver beams, Pip's light was just a soft, warm golden glow.

"I'm too tiny," sighed Pip. "Nobody on Earth can see my little light."

One dark night, a thick blanket of fog rolled over the green meadows on Earth below. A little puppy named Barnaby had wandered away from his cottage and couldn't see the path back home.

The big bright stars were shining so far up in the sky that their rays couldn't pierce through the low fog. But Pip was small and nimble! He gently drifted lower, right above the meadow.

Pip focused all his energy and beamed his warm golden sparkle through the mist. The soft glow lit up the pathway like a string of fairy lights. Barnaby wagged his tail happily and trotted safely back to his family's doorstep.

From that night on, Pip knew that you don't have to be the biggest star to make a wonderful difference in someone's world.`,
        moral: "Every one of us has a unique light that matters.",
        quiz: {
          question: "Who was lost in the dark meadow, and how did little star Pip help him?",
          targetKeywords: ["puppy", "barnaby", "dog", "lost puppy", "lit the path", "shone light through fog"],
          acceptableDetails: ["guided him home", "golden glow", "helped him see the path"],
          funFact: "Did you know? The light from the stars we see tonight started traveling through space thousands of years ago!"
        }
      }
    ];
  }

  // Get random or specific story
  getStory(query = '') {
    const clean = query.toLowerCase();
    if (clean.includes('turtle') || clean.includes('ocean') || clean.includes('kavi')) {
      return this.stories[0];
    }
    if (clean.includes('squirrel') || clean.includes('acorn') || clean.includes('sammy')) {
      return this.stories[1];
    }
    if (clean.includes('star') || clean.includes('pip') || clean.includes('puppy')) {
      return this.stories[2];
    }
    // Return a random story
    const randomIndex = Math.floor(Math.random() * this.stories.length);
    return this.stories[randomIndex];
  }

  // Validate the kid's spoken or typed answer to the comprehension quiz
  evaluateComprehensionAnswer(userAnswerText) {
    if (!this.currentActiveQuiz) return null;

    const answer = (userAnswerText || '').toLowerCase();
    const { question, targetKeywords, acceptableDetails, funFact } = this.currentActiveQuiz.quiz;
    const storyTitle = this.currentActiveQuiz.title;

    let matchCount = 0;
    targetKeywords.forEach(kw => {
      if (answer.includes(kw)) matchCount++;
    });

    acceptableDetails.forEach(detail => {
      if (answer.includes(detail)) matchCount += 1.5;
    });

    const isExcellent = matchCount >= 1.5 || (matchCount >= 1 && answer.split(' ').length >= 3);
    const isGood = matchCount >= 1;

    let responsePayload = {};

    if (isExcellent) {
      responsePayload = {
        status: 'excellent',
        stars: '⭐⭐⭐⭐⭐ (5/5 Stars)',
        badge: '🏆 Master Story Listener Badge',
        praise: `🌟 **INCREDIBLE JOB!** You listened so carefully to *"${storyTitle}"*! Your answer is spot on!`,
        spokenPraise: "Incredible job! You listened so carefully to the story and got the answer completely right! Super Star Listener Badge awarded to you!",
        feedback: `You remembered key details and characters perfectly. Keep up this wonderful habit of mindful listening!`,
        funFact
      };
    } else if (isGood) {
      responsePayload = {
        status: 'good',
        stars: '⭐⭐⭐⭐ (4/5 Stars)',
        badge: '🌟 Great Listener Star Badge',
        praise: `👏 **GREAT WORK!** You remembered the important parts of the story!`,
        spokenPraise: "Great work! You understood the story very well and remembered the main character!",
        feedback: `You got the main idea! Next time, try to also remember the character's exact name for a full 5-star score!`,
        funFact
      };
    } else {
      responsePayload = {
        status: 'encouraging',
        stars: '⭐⭐⭐ (3/5 Stars)',
        badge: '🌱 Curious Explorer Badge',
        praise: `👍 **Good try!** You are practicing and learning every single time!`,
        spokenPraise: "Good try! Listening to stories is a great way to practice. Here is a little hint for next time.",
        feedback: `The correct answer was related to: **${targetKeywords.slice(0, 2).join(', ')}**. Whenever listening to a story, try picturing the characters in your mind like a movie!`,
        funFact
      };
    }

    return responsePayload;
  }

  // Render HTML for the Story Card & Comprehension Challenge
  renderStoryCard(story) {
    this.currentActiveQuiz = story;

    return `
      <div class="rich-widget-card story-card-widget">
        <div class="story-header">
          <div class="story-header-left">
            <span class="story-emoji-huge">${story.emoji}</span>
            <div>
              <div class="story-title">${story.title}</div>
              <div class="story-meta">
                <span class="story-tag">${story.category}</span>
                <span class="story-time">⏱️ ${story.duration}</span>
              </div>
            </div>
          </div>
          <button class="story-audio-btn" onclick="window.StoryController.readStory('${story.id}')" title="Listen to Story">
            🔊 Listen
          </button>
        </div>

        <div class="story-body-text">
          ${story.content.replace(/\n\n/g, '<br><br>')}
        </div>

        <div class="story-moral-banner">
          <span>💡 <strong>Moral of the Story:</strong> ${story.moral}</span>
        </div>

        <!-- Interactive Comprehension Challenge Box -->
        <div class="comprehension-quiz-box">
          <div class="quiz-badge-header">
            <span>🎯 Story Comprehension Challenge</span>
          </div>
          <div class="quiz-question-text">
            ${story.quiz.question}
          </div>
          <div class="quiz-action-hint">
            🎙️ <em>Tap the microphone or type your answer in the chat box to get your score and listening badge!</em>
          </div>
        </div>
      </div>
    `;
  }

  // Render Evaluation Result Card
  renderEvaluationCard(evalData) {
    return `
      <div class="rich-widget-card story-eval-card ${evalData.status}">
        <div class="eval-header">
          <span class="eval-stars">${evalData.stars}</span>
          <span class="eval-badge-pill">${evalData.badge}</span>
        </div>

        <div class="eval-praise-text">
          ${evalData.praise}
        </div>

        <div class="eval-feedback-box">
          <strong>📝 Listening Feedback & Improvement:</strong>
          <p>${evalData.feedback}</p>
        </div>

        <div class="eval-fun-fact">
          <span>✨ <strong>Did You Know?</strong> ${evalData.funFact}</span>
        </div>
      </div>
    `;
  }
}

window.KidsStoryEngine = KidsStoryEngine;
