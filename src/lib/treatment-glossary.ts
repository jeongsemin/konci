// Treatment glossary: what the Korean names of common clinic treatments mean, in four languages.
// General information only: no prices (they vary by clinic, area and dose) and no claims about results.
// Plain data, no imports beyond types, so it can be unit tested and used by the search filter.
import type { Locale } from "../i18n/config.ts";

/** Date the texts were last checked (YYYY-MM-DD). Change it whenever the texts change. */
export const GLOSSARY_UPDATED = "2026-11-12";

export type TreatmentKind = "laser" | "injection" | "device" | "care";

export type TreatmentText = {
  name: string;
  /** One line for the list. */
  summary: string;
  /** What it is, in two or three sentences. */
  about: string;
  /** What the days after usually look like. */
  after: string;
  /** Things to ask the clinic before deciding. */
  ask: string[];
};

export type Treatment = {
  slug: string;
  kind: TreatmentKind;
  /** The Korean name clinics use. */
  ko: string;
  /** How to say it (Revised Romanization of the spoken form). */
  romanized: string;
  /** Words that name it in reviews, in any of the four languages (lower case). */
  keywords: string[];
  text: Record<Locale, TreatmentText>;
};

export const TREATMENTS: Treatment[] = [
  {
    slug: "laser-toning",
    kind: "laser",
    ko: "레이저 토닝",
    romanized: "reijeo toning",
    keywords: ["레이저 토닝", "레이저토닝", "토닝", "laser toning", "toning", "レーザートーニング", "トーニング", "激光嫩肤", "激光美白"],
    text: {
      en: {
        name: "Laser toning",
        summary: "A low-energy laser passed over the whole face, often used for uneven skin tone and pigmentation.",
        about: "A laser (commonly a Q-switched Nd:YAG) is passed over the face at low energy. It is usually done as a series of sessions one to two weeks apart, and is one of the most common treatments at Korean dermatology clinics.",
        after: "Mild redness for a few hours is common, and you can usually go out the same day. Sun protection is important during the series.",
        ask: ["How many sessions do you suggest, and how far apart?", "Is the price per session or for a package?"],
      },
      ja: {
        name: "レーザートーニング",
        summary: "低出力のレーザーを顔全体に照射する施術。肌のトーンのムラや色素の悩みでよく選ばれます。",
        about: "レーザー(主にQスイッチNd:YAG)を低い出力で顔全体に当てます。1〜2週間おきに数回続けて受けるのが一般的で、韓国の皮膚科で最もよく行われる施術のひとつです。",
        after: "数時間ほど軽い赤みが出ることがありますが、多くはその日のうちに外出できます。期間中は紫外線対策が大切です。",
        ask: ["何回くらい、どのくらいの間隔で受けるのがよいですか？", "料金は1回ごとですか、回数券ですか？"],
      },
      zh: {
        name: "激光调Q嫩肤(镭射托宁)",
        summary: "用低能量激光照射全脸，常用于改善肤色不均和色素问题。",
        about: "用低能量的激光(常见为调Q Nd:YAG)照射全脸。通常每隔1到2周做一次、连续做几次，是韩国皮肤科最常见的项目之一。",
        after: "术后几小时内可能轻微发红，一般当天即可外出。疗程期间要注意防晒。",
        ask: ["建议做几次？间隔多久？", "价格是单次还是套餐？"],
      },
      ko: {
        name: "레이저 토닝",
        summary: "낮은 에너지의 레이저를 얼굴 전체에 조사하는 시술. 피부 톤과 색소 고민으로 많이 받습니다.",
        about: "레이저(주로 큐스위치 엔디야그)를 낮은 에너지로 얼굴 전체에 조사합니다. 보통 1~2주 간격으로 여러 번 받으며, 한국 피부과에서 가장 흔한 시술 중 하나입니다.",
        after: "몇 시간 정도 가볍게 붉어질 수 있지만 대개 당일 외출이 가능합니다. 받는 기간에는 자외선 차단이 중요합니다.",
        ask: ["몇 회를, 어느 간격으로 받는 것이 좋을까요?", "가격은 1회 기준인가요, 패키지인가요?"],
      },
    },
  },
  {
    slug: "pico-laser",
    kind: "laser",
    ko: "피코 레이저",
    romanized: "piko reijeo",
    keywords: ["피코", "pico", "picosure", "picoway", "ピコ", "皮秒"],
    text: {
      en: {
        name: "Pico laser",
        summary: "A laser with very short pulses, used for pigmented spots, toning and tattoo removal.",
        about: "Pico lasers fire pulses lasting picoseconds. Clinics use them over the whole face (pico toning) or on individual spots, and also for tattoo removal.",
        after: "Whole-face toning usually leaves only mild redness. Treated spots can darken and form small scabs for about a week; let them come off on their own.",
        ask: ["Is this whole-face toning or spot treatment?", "Will I need to cover the treated spots, and for how long?"],
      },
      ja: {
        name: "ピコレーザー",
        summary: "非常に短いパルスのレーザー。シミ、トーニング、タトゥー除去に使われます。",
        about: "ピコ秒単位の短いパルスで照射するレーザーです。顔全体(ピコトーニング)にも、シミ一つひとつにも使われ、タトゥー除去にも用いられます。",
        after: "顔全体のトーニングなら軽い赤み程度のことが多いです。シミに当てた場合は1週間ほど黒ずんでかさぶたになることがあり、自然に取れるのを待ちます。",
        ask: ["顔全体のトーニングですか、シミのピンポイント照射ですか？", "照射した部分は保護テープが必要ですか？期間は？"],
      },
      zh: {
        name: "皮秒激光",
        summary: "脉冲极短的激光，用于色斑、嫩肤和洗纹身。",
        about: "皮秒激光以皮秒级的短脉冲照射。可以照全脸(皮秒嫩肤)，也可以针对单个色斑，还用于洗纹身。",
        after: "全脸嫩肤通常只是轻微发红。针对色斑照射时，斑点可能变深并结痂约一周，请等它自然脱落。",
        ask: ["是全脸嫩肤还是点斑？", "照射处需要贴保护贴吗？要贴多久？"],
      },
      ko: {
        name: "피코 레이저",
        summary: "펄스가 아주 짧은 레이저. 색소 병변, 토닝, 문신 제거에 쓰입니다.",
        about: "피코초 단위의 짧은 펄스로 조사하는 레이저입니다. 얼굴 전체(피코 토닝)나 점·잡티 하나하나에 쓰고, 문신 제거에도 사용합니다.",
        after: "얼굴 전체 토닝은 가벼운 붉은기 정도인 경우가 많습니다. 잡티에 조사하면 일주일쯤 진해지며 딱지가 앉을 수 있으니 저절로 떨어질 때까지 둡니다.",
        ask: ["얼굴 전체 토닝인가요, 잡티 부분 시술인가요?", "시술 부위에 재생 테이프를 붙여야 하나요? 얼마나요?"],
      },
    },
  },
  {
    slug: "rejuran",
    kind: "injection",
    ko: "리쥬란",
    romanized: "rijuran",
    keywords: ["리쥬란", "rejuran", "리쥬란힐러", "pn 주사", "リジュラン", "丽珠兰", "麗珠蘭"],
    text: {
      en: {
        name: "Rejuran (PN skin booster)",
        summary: "Small injections of polynucleotide (PN), a type of skin booster made in Korea.",
        about: "Rejuran is a brand of polynucleotide (PN) injections derived from salmon DNA. Many tiny injections are made across the face or around the eyes, usually as several sessions a few weeks apart. Numbing cream is often applied first.",
        after: "Small bumps and redness at the injection points are common for one to three days, and bruises can appear. Makeup is usually avoided on the day.",
        ask: ["Is it genuine Rejuran, and how many syringes (cc) are included?", "I have a fish allergy (if so): is this suitable for me?"],
      },
      ja: {
        name: "リジュラン(PNスキンブースター)",
        summary: "ポリヌクレオチド(PN)を細かく注入する、韓国製のスキンブースター。",
        about: "リジュランはサケ由来のDNAから作られたポリヌクレオチド(PN)製剤のブランドです。顔全体や目元に細かく何か所も注入し、数週間おきに数回受けるのが一般的です。先に麻酔クリームを塗ることが多いです。",
        after: "注入した所に小さな膨らみや赤みが1〜3日ほど残ることが多く、内出血が出ることもあります。当日はメイクを控えるのが一般的です。",
        ask: ["正規品のリジュランですか？何cc(何本)含まれますか？", "魚アレルギーがありますが(該当する場合)、受けても大丈夫ですか？"],
      },
      zh: {
        name: "丽珠兰(PN水光/婴儿针)",
        summary: "注射多核苷酸(PN)的韩国产皮肤助推剂。",
        about: "丽珠兰是用三文鱼DNA提取的多核苷酸(PN)制剂品牌。在全脸或眼周细密地多点注射，通常间隔几周做几次。注射前一般会先涂麻药膏。",
        after: "注射点常会有小鼓包和发红，持续1到3天，也可能出现淤青。当天一般不化妆。",
        ask: ["是正品丽珠兰吗？包含几支(几cc)？", "我对鱼类过敏(如适用)，可以做吗？"],
      },
      ko: {
        name: "리쥬란 (PN 스킨부스터)",
        summary: "폴리뉴클레오티드(PN)를 촘촘히 주입하는 국산 스킨부스터.",
        about: "리쥬란은 연어 DNA에서 얻은 폴리뉴클레오티드(PN) 제제의 브랜드입니다. 얼굴 전체나 눈가에 촘촘히 여러 번 주입하며, 보통 몇 주 간격으로 여러 번 받습니다. 먼저 마취 크림을 바르는 경우가 많습니다.",
        after: "주입한 자리에 작은 엠보와 붉은기가 1~3일쯤 남는 경우가 많고 멍이 들 수도 있습니다. 당일에는 화장을 피하는 편입니다.",
        ask: ["정품 리쥬란인가요? 몇 cc가 포함되나요?", "(해당하면) 생선 알레르기가 있는데 받아도 될까요?"],
      },
    },
  },
  {
    slug: "skin-booster",
    kind: "injection",
    ko: "스킨부스터",
    romanized: "seukinbuseuteo",
    keywords: ["스킨부스터", "물광", "물광주사", "skin booster", "skinbooster", "water glow", "スキンブースター", "水光注射", "水光针", "水光"],
    text: {
      en: {
        name: "Skin booster (water-glow injection)",
        summary: "Tiny injections across the face, often of hyaluronic acid, for skin hydration.",
        about: "“Skin booster” is a general name for many small injections into the skin; the Korean “물광주사” (water-glow injection) usually means hyaluronic acid. Clinics may use a handpiece that injects several points at once. Products and doses differ widely between clinics.",
        after: "Small bumps, redness or bruises for one to three days are common. Avoid saunas and heavy exercise for a day or two.",
        ask: ["Which product is used, and how much?", "Is numbing included in the price?"],
      },
      ja: {
        name: "スキンブースター(水光注射)",
        summary: "顔全体に細かく注入する施術。主にヒアルロン酸で、うるおいを目的とします。",
        about: "スキンブースターは肌に細かく注入する施術の総称で、韓国語の「물광주사(水光注射)」は主にヒアルロン酸を指します。複数の針で同時に注入する機器を使う病院もあります。製剤や量は病院によって大きく異なります。",
        after: "1〜3日ほど小さな膨らみや赤み、内出血が出ることがよくあります。1〜2日はサウナや激しい運動を控えましょう。",
        ask: ["どの製剤をどのくらい使いますか？", "麻酔は料金に含まれますか？"],
      },
      zh: {
        name: "水光针(皮肤助推剂)",
        summary: "在全脸细密注射，多为玻尿酸，用于补水。",
        about: "“皮肤助推剂”是在皮肤内细密注射的统称，韩语“물광주사(水光针)”一般指玻尿酸。有的诊所使用可同时多点注射的仪器。所用产品和剂量因诊所差异很大。",
        after: "1到3天内常有小鼓包、发红或淤青。一两天内避免桑拿和剧烈运动。",
        ask: ["用的是什么产品？用量多少？", "麻药是否包含在价格里？"],
      },
      ko: {
        name: "스킨부스터 (물광주사)",
        summary: "얼굴 전체에 촘촘히 주입하는 시술. 주로 히알루론산으로 피부 수분을 목적으로 합니다.",
        about: "스킨부스터는 피부에 촘촘히 주입하는 시술을 두루 부르는 말이고, 물광주사는 보통 히알루론산을 뜻합니다. 여러 바늘로 한 번에 주입하는 기기를 쓰는 병원도 있습니다. 제품과 용량은 병원마다 크게 다릅니다.",
        after: "1~3일쯤 작은 엠보, 붉은기, 멍이 생기는 경우가 흔합니다. 하루 이틀은 사우나와 격한 운동을 피하세요.",
        ask: ["어떤 제품을 얼마나 쓰나요?", "마취가 가격에 포함되나요?"],
      },
    },
  },
  {
    slug: "botox",
    kind: "injection",
    ko: "보톡스",
    romanized: "botokseu",
    keywords: ["보톡스", "보툴리눔", "사각턱", "botox", "botulinum", "toxin", "ボトックス", "ボツリヌス", "肉毒", "瘦脸针"],
    text: {
      en: {
        name: "Botulinum toxin (“Botox”)",
        summary: "Injections that relax muscles, used for expression lines and for slimming the jaw muscle.",
        about: "Koreans call all botulinum toxin “보톡스” (Botox), although many clinics use Korean or other brands. Common areas are the forehead, frown lines, crow's feet and the jaw (masseter) muscle. The effect usually appears within days and fades over several months.",
        after: "Small bumps at the injection points settle within an hour or so. Clinics usually advise not to massage or press the area that day.",
        ask: ["Which brand is used, and how many units?", "Is a touch-up included if one side looks different?"],
      },
      ja: {
        name: "ボツリヌストキシン(ボトックス)",
        summary: "筋肉の動きを和らげる注射。表情じわやエラの筋肉に使われます。",
        about: "韓国ではボツリヌストキシン全般を「보톡스(ボトックス)」と呼びますが、実際は韓国製など別のブランドを使う病院も多いです。額、眉間、目尻、エラ(咬筋)がよく選ばれます。効果は通常数日で現れ、数か月かけて薄れていきます。",
        after: "注射した所の小さな膨らみは1時間ほどで落ち着きます。当日はマッサージや強く押すことを控えるよう案内されるのが一般的です。",
        ask: ["どのブランドを何単位使いますか？", "左右差が出た場合、追加注入は含まれますか？"],
      },
      zh: {
        name: "肉毒素(“保妥适”/瘦脸针)",
        summary: "放松肌肉的注射，用于表情纹和瘦咬肌。",
        about: "韩国人把各种肉毒素都叫“보톡스(Botox)”，但很多诊所实际使用韩国产或其他品牌。常见部位有额头、眉间、鱼尾纹和咬肌。效果一般几天内出现，几个月后逐渐消退。",
        after: "注射点的小鼓包大约一小时内平复。诊所通常建议当天不要按摩或用力按压。",
        ask: ["用的是什么品牌？打多少单位？", "如果左右不对称，补打是否包含在内？"],
      },
      ko: {
        name: "보톡스 (보툴리눔 톡신)",
        summary: "근육의 움직임을 줄이는 주사. 표정 주름과 사각턱에 많이 씁니다.",
        about: "한국에서는 보툴리눔 톡신을 모두 보톡스라고 부르지만, 실제로는 국산 등 다른 브랜드를 쓰는 병원이 많습니다. 이마, 미간, 눈가, 사각턱(교근)에 흔히 맞습니다. 효과는 보통 며칠 안에 나타나고 몇 달에 걸쳐 줄어듭니다.",
        after: "주사 자리의 작은 부기는 한 시간쯤이면 가라앉습니다. 당일에는 마사지하거나 세게 누르지 말라고 안내하는 경우가 많습니다.",
        ask: ["어떤 브랜드를 몇 유닛 쓰나요?", "좌우 차이가 나면 추가 주사가 포함되나요?"],
      },
    },
  },
  {
    slug: "filler",
    kind: "injection",
    ko: "필러",
    romanized: "pilleo",
    keywords: ["필러", "filler", "히알루론산 필러", "フィラー", "ヒアルロン酸注入", "玻尿酸", "填充"],
    text: {
      en: {
        name: "Dermal filler",
        summary: "Gel injected to add volume, for example to the nose, chin, lips or under the eyes.",
        about: "Most fillers in Korea are hyaluronic acid gels. Hyaluronic acid filler can be dissolved with an enzyme if needed. Rare but serious complications exist, such as a filler blocking a blood vessel, so the doctor's experience matters.",
        after: "Swelling and bruising for a few days are common. Contact the clinic at once if you notice severe pain, skin turning white or dark, or changes in vision.",
        ask: ["Which product is used, and how many cc?", "Who does the injection, and what happens if I need it dissolved?"],
      },
      ja: {
        name: "フィラー(ヒアルロン酸注入)",
        summary: "ジェルを注入してボリュームを出す施術。鼻、あご、唇、目の下などに使われます。",
        about: "韓国のフィラーは主にヒアルロン酸のジェルです。ヒアルロン酸フィラーは必要なら酵素で溶かせます。まれに血管が詰まるなどの重い合併症があるため、医師の経験が大切です。",
        after: "数日ほど腫れや内出血が出ることがよくあります。強い痛み、皮膚が白や紫に変わる、見え方の変化があればすぐ病院に連絡してください。",
        ask: ["どの製剤を何cc使いますか？", "注入するのは誰ですか？溶かす必要が出たらどうなりますか？"],
      },
      zh: {
        name: "填充剂(玻尿酸填充)",
        summary: "注射凝胶增加容量，如鼻子、下巴、嘴唇或眼下。",
        about: "韩国的填充剂大多是玻尿酸凝胶。玻尿酸填充剂必要时可以用酶溶解。存在罕见但严重的并发症，例如填充剂堵塞血管，因此医生的经验很重要。",
        after: "几天内常会肿胀和淤青。如果出现剧痛、皮肤发白或发紫、视力变化，请立即联系诊所。",
        ask: ["用的是什么产品？多少cc？", "由谁注射？如果需要溶解怎么办？"],
      },
      ko: {
        name: "필러",
        summary: "젤을 주입해 볼륨을 채우는 시술. 코, 턱, 입술, 눈밑 등에 씁니다.",
        about: "한국의 필러는 대부분 히알루론산 젤입니다. 히알루론산 필러는 필요하면 효소로 녹일 수 있습니다. 드물지만 필러가 혈관을 막는 등 심각한 합병증이 있어 의사의 경험이 중요합니다.",
        after: "며칠 동안 붓기와 멍이 생기는 경우가 흔합니다. 심한 통증, 피부가 하얗거나 검붉게 변함, 시야 변화가 있으면 바로 병원에 연락하세요.",
        ask: ["어떤 제품을 몇 cc 쓰나요?", "누가 주사하나요? 녹여야 하면 어떻게 하나요?"],
      },
    },
  },
  {
    slug: "hifu-lifting",
    kind: "device",
    ko: "울쎄라·슈링크",
    romanized: "ulssera·syuringkeu",
    keywords: ["울쎄라", "슈링크", "하이푸", "ulthera", "ultherapy", "shurink", "hifu", "ウルセラ", "シュリンク", "ハイフ", "超声刀"],
    text: {
      en: {
        name: "HIFU lifting (Ulthera, Shurink)",
        summary: "Focused ultrasound that heats deeper layers of the skin, used for lifting.",
        about: "HIFU devices focus ultrasound energy below the skin surface. Ulthera (Ultherapy) and Shurink are the device names you will hear most in Korea. Prices are usually set by the number of shots (lines), and it can feel uncomfortable during treatment.",
        after: "There is usually no downtime, though mild redness, swelling or tenderness for a few days can happen. Changes, if any, appear gradually over weeks.",
        ask: ["Which device is it, and how many shots are included?", "Is numbing or pain relief included?"],
      },
      ja: {
        name: "HIFU(ハイフ)リフト(ウルセラ、シュリンク)",
        summary: "集束超音波で肌の深い層を温める、リフトアップ目的の施術。",
        about: "HIFU機器は超音波を皮膚の奥に集めて照射します。韓国ではウルセラ(ウルセラピー)とシュリンクという機器名をよく耳にします。料金はショット数(ライン数)で決まることが多く、施術中に痛みを感じることがあります。",
        after: "ダウンタイムはほとんどありませんが、数日ほど軽い赤み、腫れ、押したときの痛みが出ることがあります。変化がある場合も数週間かけて少しずつ現れます。",
        ask: ["どの機器で、何ショット含まれますか？", "麻酔や痛みの対策は含まれますか？"],
      },
      zh: {
        name: "超声刀提升(Ulthera、Shurink)",
        summary: "用聚焦超声加热皮肤深层，以提升为目的。",
        about: "超声刀(HIFU)仪器把超声能量聚焦在皮肤深处。在韩国最常听到的仪器名是 Ulthera(美版超声刀)和 Shurink。价格通常按发数(线数)计算，治疗时可能会感到疼痛。",
        after: "一般没有恢复期，但几天内可能轻微发红、肿胀或按压痛。即使有变化，也是几周内逐渐出现。",
        ask: ["用的是哪台仪器？包含多少发？", "是否包含麻醉或止痛？"],
      },
      ko: {
        name: "하이푸 리프팅 (울쎄라·슈링크)",
        summary: "집속 초음파로 피부 깊은 층을 가열하는 리프팅 목적의 시술.",
        about: "하이푸(HIFU) 기기는 초음파 에너지를 피부 속에 모아 조사합니다. 한국에서는 울쎄라와 슈링크라는 기기 이름을 가장 많이 듣게 됩니다. 가격은 보통 샷(라인) 수로 정해지고, 시술 중 통증이 느껴질 수 있습니다.",
        after: "대개 회복 기간은 거의 없지만 며칠쯤 가벼운 붉은기, 붓기, 누를 때 아픔이 있을 수 있습니다. 변화가 있다면 몇 주에 걸쳐 서서히 나타납니다.",
        ask: ["어떤 기기로, 몇 샷이 포함되나요?", "마취나 통증 관리가 포함되나요?"],
      },
    },
  },
  {
    slug: "thermage",
    kind: "device",
    ko: "써마지",
    romanized: "sseomaji",
    keywords: ["써마지", "thermage", "サーマクール", "サーマジ", "热玛吉", "熱瑪吉"],
    text: {
      en: {
        name: "Thermage (radiofrequency)",
        summary: "A radiofrequency device that heats the skin, used for tightening.",
        about: "Thermage is a brand of monopolar radiofrequency treatment. It is usually a single session, priced by the number of shots, and treatment can feel hot. Clinics should use a new, genuine tip for each patient.",
        after: "Mild redness or swelling may last a day or so; most people go out the same day. Changes, if any, appear gradually over months.",
        ask: ["How many shots are included, and is the tip genuine and new?", "Which areas will be treated (face, eyes, neck)?"],
      },
      ja: {
        name: "サーマクール(高周波)",
        summary: "高周波で肌を温める、引き締め目的の機器施術。",
        about: "韓国では「써마지(サーマジ)」と呼ばれ、日本ではサーマクールとして知られる単極高周波のブランドです。通常は1回の施術でショット数で料金が決まり、施術中は熱さを感じることがあります。患者ごとに新しい正規品のチップを使うべきものです。",
        after: "1日ほど軽い赤みや腫れが出ることがありますが、多くはその日のうちに外出できます。変化がある場合も数か月かけて少しずつ現れます。",
        ask: ["何ショット含まれますか？チップは新品の正規品ですか？", "どの部位に照射しますか(顔、目元、首)？"],
      },
      zh: {
        name: "热玛吉(射频)",
        summary: "用射频加热皮肤的紧致类仪器项目。",
        about: "热玛吉(Thermage)是单极射频的品牌。通常只做一次，按发数计价，治疗时会感到发热。诊所应为每位患者使用全新的正品治疗头。",
        after: "可能轻微发红或肿胀一天左右，多数人当天即可外出。即使有变化，也是几个月内逐渐出现。",
        ask: ["包含多少发？治疗头是全新正品吗？", "治疗哪些部位(全脸、眼周、颈部)？"],
      },
      ko: {
        name: "써마지 (고주파)",
        summary: "고주파로 피부를 가열하는 탄력 목적의 기기 시술.",
        about: "써마지는 단극성 고주파 시술의 브랜드입니다. 보통 한 번 받으며 샷 수로 가격이 정해지고, 시술 중 뜨겁게 느껴질 수 있습니다. 환자마다 새 정품 팁을 써야 합니다.",
        after: "하루쯤 가벼운 붉은기나 붓기가 있을 수 있지만 대부분 당일 외출이 가능합니다. 변화가 있다면 몇 달에 걸쳐 서서히 나타납니다.",
        ask: ["몇 샷이 포함되나요? 팁은 새 정품인가요?", "어느 부위에 하나요 (얼굴, 눈가, 목)?"],
      },
    },
  },
  {
    slug: "aqua-peel",
    kind: "care",
    ko: "아쿠아필",
    romanized: "akuapil",
    keywords: ["아쿠아필", "아쿠아 필", "aqua peel", "aquapeel", "hydrafacial", "アクアピール", "ハイドラフェイシャル", "小气泡", "水氧"],
    text: {
      en: {
        name: "Aqua peel",
        summary: "Cleansing that uses water and suction to clear pores and dead skin.",
        about: "A handpiece sprays a cleansing solution and suctions at the same time, removing dead skin and clearing pores. It is often added before other treatments, or done on its own as skin care.",
        after: "There is usually no downtime; slight redness fades within hours.",
        ask: ["Is it a standalone treatment or added to another one?", "Is extraction or a mask included?"],
      },
      ja: {
        name: "アクアピール",
        summary: "水と吸引で毛穴の汚れや古い角質を取り除くケア。",
        about: "専用のハンドピースで洗浄液を出しながら吸引し、古い角質や毛穴の汚れを取り除きます。ほかの施術の前に組み合わせたり、単独のスキンケアとして受けたりします。",
        after: "ダウンタイムはほとんどなく、軽い赤みも数時間で引きます。",
        ask: ["単独の施術ですか、ほかの施術とのセットですか？", "圧出やパックは含まれますか？"],
      },
      zh: {
        name: "小气泡(水氧清洁)",
        summary: "用水和负压吸引清洁毛孔和老化角质。",
        about: "用专用仪器一边喷洒清洁液一边吸引，去除老化角质并清洁毛孔。常在其他项目之前加做，也可以单独作为皮肤护理。",
        after: "一般没有恢复期，轻微发红几小时内就会消退。",
        ask: ["是单独项目还是搭配其他项目？", "是否包含挤痘(粉刺清理)或面膜？"],
      },
      ko: {
        name: "아쿠아필",
        summary: "물과 흡입으로 모공과 각질을 정리하는 관리.",
        about: "전용 기기로 세정액을 뿌리면서 동시에 흡입해 각질과 모공 속 노폐물을 정리합니다. 다른 시술 전에 함께 받거나 단독 피부 관리로 받습니다.",
        after: "대개 회복 기간이 없고, 가벼운 붉은기도 몇 시간이면 가라앉습니다.",
        ask: ["단독 시술인가요, 다른 시술과 함께인가요?", "압출이나 팩이 포함되나요?"],
      },
    },
  },
  {
    slug: "acne-treatment",
    kind: "care",
    ko: "여드름 치료",
    romanized: "yeodeureum chiryo",
    keywords: ["여드름", "압출", "acne", "pimple", "ニキビ", "にきび", "痤疮", "痘痘", "粉刺"],
    text: {
      en: {
        name: "Acne treatment",
        summary: "Doctor-led care for acne: extraction, peels, light or laser treatments and medicine.",
        about: "Dermatology clinics combine treatments such as extraction, chemical peels and light or laser therapy, and may prescribe medicine. Prescription medicine needs a doctor's consultation, and the pharmacy is usually separate from the clinic.",
        after: "After extraction or a peel, redness can last a day or two. Acne usually needs several visits, which can be hard on a short trip.",
        ask: ["What can be done in one visit during my stay?", "Will I get a prescription, and can I take the medicine home?"],
      },
      ja: {
        name: "ニキビ治療",
        summary: "医師によるニキビ治療。圧出、ピーリング、光・レーザー、薬など。",
        about: "皮膚科では圧出、ケミカルピーリング、光やレーザー治療などを組み合わせ、薬を処方することもあります。処方薬には医師の診察が必要で、薬局は病院とは別のことが一般的です。",
        after: "圧出やピーリングの後は1〜2日赤みが残ることがあります。ニキビは通院が何回も必要なことが多く、短い旅行では難しい場合があります。",
        ask: ["滞在中、1回の来院で何ができますか？", "処方薬は出ますか？持ち帰れますか？"],
      },
      zh: {
        name: "痤疮(痘痘)治疗",
        summary: "由医生进行的痘痘治疗：清痘、刷酸、光疗或激光和药物。",
        about: "皮肤科会组合清痘、化学换肤、光疗或激光等方法，也可能开药。处方药需要医生面诊，药房一般与诊所分开。",
        after: "清痘或换肤后可能发红一两天。痘痘通常需要多次就诊，短期旅行可能难以完成。",
        ask: ["在我停留期间，一次就诊能做什么？", "会开处方药吗？可以带回国吗？"],
      },
      ko: {
        name: "여드름 치료",
        summary: "의사가 하는 여드름 치료. 압출, 필링, 빛·레이저 치료, 약 처방 등.",
        about: "피부과에서는 압출, 화학 필링, 빛이나 레이저 치료 등을 함께 쓰고 약을 처방하기도 합니다. 처방약은 의사 진료가 필요하고, 약국은 보통 병원과 따로 있습니다.",
        after: "압출이나 필링 뒤에는 하루 이틀 붉은기가 남을 수 있습니다. 여드름은 여러 번 다녀야 하는 경우가 많아 짧은 여행 중에는 어려울 수 있습니다.",
        ask: ["머무는 동안 한 번 방문으로 무엇을 할 수 있나요?", "처방약이 나오나요? 가지고 돌아갈 수 있나요?"],
      },
    },
  },
  {
    slug: "mole-removal",
    kind: "laser",
    ko: "점 빼기",
    romanized: "jeom ppaegi",
    keywords: ["점 빼", "점빼", "점 제거", "점제거", "mole", "mole removal", "ホクロ", "ほくろ", "黒子", "祛痣", "点痣"],
    text: {
      en: {
        name: "Mole removal",
        summary: "Removing moles and small skin growths, usually with a CO2 laser.",
        about: "Clinics usually remove moles with a CO2 laser after numbing. Prices are often per mole or by size. A mole that has changed shape, colour or size should be examined by a doctor first, not simply removed.",
        after: "Each spot is covered with a patch and forms a scab for about a week; then the skin may stay pink for a while. Sun protection helps the mark fade.",
        ask: ["Is the price per mole, and does size matter?", "How should I care for the spots while travelling?"],
      },
      ja: {
        name: "ほくろ除去",
        summary: "ほくろや小さなできものを、主にCO2レーザーで取る施術。",
        about: "麻酔をしてからCO2レーザーで取るのが一般的です。料金は1個ごとや大きさで決まることが多いです。形・色・大きさが変わったほくろは、取る前にまず医師の診察を受けるべきです。",
        after: "取った所に保護テープを貼り、1週間ほどかさぶたになります。その後しばらく赤みが残ることがあり、紫外線対策で跡が薄くなりやすくなります。",
        ask: ["料金は1個ごとですか？大きさで変わりますか？", "旅行中のケアはどうすればいいですか？"],
      },
      zh: {
        name: "点痣(祛痣)",
        summary: "去除痣和皮肤小赘生物，多用CO2激光。",
        about: "一般先麻醉再用CO2激光去除。价格常按颗数或大小计算。形状、颜色或大小有变化的痣，应先让医生检查，而不是直接去掉。",
        after: "去除处要贴保护贴，结痂约一周；之后皮肤可能会粉红一段时间。做好防晒有助于痕迹变淡。",
        ask: ["是按颗收费吗？大小会影响价格吗？", "旅行期间该怎么护理？"],
      },
      ko: {
        name: "점 빼기",
        summary: "점과 작은 피부 돌기를 주로 CO2 레이저로 없애는 시술.",
        about: "마취 후 CO2 레이저로 빼는 것이 일반적입니다. 가격은 점 1개당이나 크기로 정하는 경우가 많습니다. 모양·색·크기가 변한 점은 빼기 전에 먼저 의사의 진찰을 받아야 합니다.",
        after: "뺀 자리에 재생 테이프를 붙이고 일주일쯤 딱지가 앉습니다. 그 뒤 한동안 붉은 자국이 남을 수 있고, 자외선 차단을 하면 흐려지는 데 도움이 됩니다.",
        ask: ["점 1개당 가격인가요? 크기에 따라 달라지나요?", "여행 중에는 어떻게 관리하면 되나요?"],
      },
    },
  },
];

export function getTreatment(slug: string): Treatment | undefined {
  return TREATMENTS.find((t) => t.slug === slug);
}

/** The glossary entry named by a search treatment value (its Korean name), if any. */
export function treatmentByKo(ko: string): Treatment | undefined {
  return TREATMENTS.find((t) => t.ko === ko);
}

/** The sentence to show the clinic: "I'd like a consultation about …". */
export function consultationPhrase(t: Treatment): { ko: string; romanized: string } {
  return { ko: `${t.ko} 상담을 받고 싶어요.`, romanized: `${t.romanized} sangdameul batgo sipeoyo.` };
}
