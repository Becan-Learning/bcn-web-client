import type { Localized } from "@/i18n/localized";

/* H1 — أسئلة الطالب الشائعة.

   **الأول إلزامًا: «وش الفرق بينك وبين ChatGPT؟»** — أكثر سؤال سيصل،
   وجوابه يجب أن يكون في مكان يجده. لهذا هو أول سؤال في أول قسم، لا
   مدفونًا في قسم «عن بيكان».

   الجواب يقارن بما يفعله المنتج فعلًا — مصدر المحتوى، السبورة،
   السؤال بعد الشرح — لا بادّعاء تفوّق عام. */

export type Question = {
  q: Localized;
  /** أسطر الجواب — كل سطر فقرة */
  a: Localized[];
};

export type FaqGroup = {
  id: string;
  title: Localized;
  questions: Question[];
};

export const FAQ: FaqGroup[] = [
  {
    id: "what",
    title: { ar: "بيكان وش يسوي", en: "What Becan does" },
    questions: [
      {
        q: { ar: "وش الفرق بينك وبين ChatGPT؟", en: "How is Becan different from ChatGPT?" },
        a: [
          { ar: "ChatGPT يجاوب على السؤال اللي تكتبه. بيكان يشرح لك مقررك أنت: يبدأ من الفصل اللي عندك، ويمشي على مواضيعه بالترتيب، ويكتب على سبورة قدامك وهو يتكلّم.", en: "With ChatGPT, you type a question and get an answer. With Becan, you study your course: start from your chapter, follow its topics in order, and see notes written on the board as you listen." },
          { ar: "الفرق العملي في ثلاثة أشياء: المحتوى مبني على مصادر مقررك لا على معرفة عامة، وبيكان يسألك بعد كل موضوع عشان يتأكّد إنك فهمت لا عشان يكمّل الكلام، ويطلع لك في آخر الجلسة وين تعثّرت بالضبط ووش الخطأ اللي يفقدك الدرجة فيه.", en: "There are three practical differences: the content uses your course sources; you answer a question after each topic to check your understanding; and you finish with a summary of where you struggled and which mistakes could cost you marks." },
          { ar: "وأنت ما ترفع شيء ولا تكتب برومبت — تختار مقررك وفصلك وبس.", en: "You don’t need to upload anything or write a prompt. Just choose your course and chapter." },
        ],
      },
      {
        q: { ar: "بيكان يغنيني عن المحاضرة؟", en: "Can Becan replace my lectures?" },
        a: [
          { ar: "لا. بيكان مادة مساندة تذاكر بها قبل الاختبار أو بعد محاضرة ما فهمتها. أستاذك يحدّد وش يجي في الاختبار، وإحنا نشرح لك المحتوى ونتأكّد إنك ماسكه.", en: "No. Use Becan to study before an exam or revisit a lecture you didn’t understand. Your lecturer decides what’s on the exam; here, you review the material and check your understanding." },
        ],
      },
      {
        q: { ar: "أقدر أستخدمه على الجوال؟", en: "Can I use it on my phone?" },
        a: [
          { ar: "إي. الجلسة تشتغل على الجوال، والأفضل بالوضع الأفقي عشان السبورة تاخذ مساحتها — ونبّهك لها أول ما تبدأ.", en: "Yes. Sessions work on your phone. Landscape gives the board more room — you’ll see a reminder when you start." },
        ],
      },
    ],
  },
  {
    id: "courses",
    title: { ar: "المقررات", en: "Courses" },
    questions: [
      {
        q: { ar: "مقرري مو موجود، وش أسوي؟", en: "My course isn’t listed. What can I do?" },
        a: [
          { ar: "اطلبه من صفحة «اطلب مقررك»: تكتب اسم المقرر أو رمزه وجامعتك، وتوصلك رسالة أول ما يجهز.", en: "Use the “Request your course” page. Enter the course name or code and your university, and you’ll get a message when it’s ready." },
          { ar: "الطلبات المتكرّرة على نفس المقرر ترفعه في الترتيب، فطلبك مو مجرّد تسجيل.", en: "More requests for the same course raise its priority in the queue. Your request helps decide what comes next." },
        ],
      },
      {
        q: { ar: "ليش بعض الفصول مكتوب عليها «قريبًا»؟", en: "Why do some chapters say “Coming soon”?" },
        a: [
          { ar: "لأن محتواها ما جهز بعد. ما نفتح فصلًا قبل ما يكتمل شرحه ويُراجَع — نفضّل نقول لك «مو جاهز» على إن ندخّلك جلسة ناقصة.", en: "Their content isn’t ready yet. A chapter opens once its explanation is prepared and reviewed, so you don’t start an unfinished session." },
        ],
      },
    ],
  },
  {
    id: "voice",
    title: { ar: "الصوت والميكروفون", en: "Voice and microphone" },
    questions: [
      {
        q: { ar: "هل تسجّلون صوتي؟", en: "Do you record my voice?" },
        a: [
          { ar: "الميكروفون ما يشتغل إلا لما تضغط زر الكلام — ما فيه استماع مستمر.", en: "Your microphone only turns on when you press the talk button. It doesn’t listen continuously." },
          { ar: "صوتك يتحوّل إلى نصّ عشان يفهم بيكان سؤالك، والتسجيل نفسه يُحذف تلقائيًا خلال 24 ساعة. وما نستعمله في تدريب نماذج.", en: "Your voice is converted to text so Becan can understand your question. The recording is automatically deleted within 24 hours and isn’t used to train models." },
          { ar: "إذا تبيه يبقى 30 يوم عشان تسمعه بنفسك، فيه خيار تشغّله أنت من تفضيلات المذاكرة، ومطفأ افتراضيًا.", en: "If you want to keep it for 30 days to listen back, turn on the option in your study preferences. It’s off by default." },
        ],
      },
      {
        q: { ar: "الميكروفون ما يشتغل", en: "My microphone isn’t working" },
        a: [
          { ar: "أول شيء: تأكّد إن المتصفّح أخذ الإذن. إذا رفضته أول مرة، افتح إعدادات الموقع في متصفّحك وفعّل الميكروفون ثم حدّث الصفحة.", en: "First, check your browser’s microphone permission. If you denied it earlier, open the site settings, allow the microphone, then refresh the page." },
          { ar: "على الجوال، أقفل التطبيقات اللي تستعمل الميكروفون — المكالمات وتطبيقات التسجيل تمسكه ولا تشاركه.", en: "On your phone, close other apps using the microphone. Calls and recording apps can prevent your browser from using it." },
          { ar: "وإذا ضل ما يشتغل، تقدر تكمّل الجلسة كتابة: تكتب سؤالك بدل ما تنطقه، وبيكان يجاوب بصوته زي ما هو.", en: "If it still doesn’t work, type your questions and continue the session. You’ll still hear the answers by voice." },
        ],
      },
    ],
  },
  {
    id: "money",
    title: { ar: "الاشتراك والدفع", en: "Subscriptions and payments" },
    questions: [
      {
        q: { ar: "كيف ألغي الاشتراك؟", en: "How do I cancel my subscription?" },
        a: [
          { ar: "من الإعدادات ← الاشتراك ← «ألغِ التجديد»، بخطوة تأكيد واحدة. ما نطلب سبب ولا نحوّلك على أحد.", en: "Go to Settings → Subscription → “Cancel renewal”, then confirm once. You don’t need to give a reason or contact anyone." },
          { ar: "الإلغاء يوقف التجديد الجاي فقط: خطتك تكمل شغّالة بدقائقها إلى نهاية المدة اللي دفعتها، والتاريخ مكتوب لك في نفس الصفحة.", en: "Cancellation stops the next renewal. You keep your plan and minutes until the end of your paid period; the date is shown on the same page." },
        ],
      },
      {
        q: { ar: "وش يصير لو خلصت دقائقي؟", en: "What happens if I run out of minutes?" },
        a: [
          { ar: "الجلسة اللي أنت فيها تكمل إلى آخرها — ما نقطعها عليك.", en: "You can finish the session you’re in without interruption." },
          { ar: "بعدها تشوف كم ذاكرت وكم باقي عليك قبل اختبارك، وتختار: ترقّي، أو تنتظر تجديد حصتك في بداية الشهر.", en: "Afterwards, see how much you’ve studied and what’s left before your exam. You can upgrade or wait for your minutes to renew at the start of the month." },
        ],
      },
      {
        q: { ar: "أقدر أدفع بمدى؟", en: "Can I pay with mada?" },
        a: [
          { ar: "إي، ومدى هي الخيار الأول في صفحة الدفع. وفيه Apple Pay والبطاقات الائتمانية.", en: "Yes. mada is the first option at checkout. Apple Pay and credit cards are also available." },
        ],
      },
      {
        q: { ar: "الأسعار شاملة الضريبة؟", en: "Do prices include VAT?" },
        a: [
          { ar: "إي، السعر اللي تشوفه هو اللي ينخصم — ما فيه رسوم تنضاف عند الدفع. والفاتورة تفصل لك الصافي عن ضريبة القيمة المضافة.", en: "Yes. You pay the price shown, with no added charges at checkout. Your invoice lists the net amount and VAT separately." },
        ],
      },
    ],
  },
];
