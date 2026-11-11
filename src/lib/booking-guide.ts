// "How to book a clinic in Korea" guide. Plain data so it can be unit tested and rendered by one page.
// KONCI only explains the usual ways to book: it never takes bookings or fees (see the intro and caution texts).
import type { Locale } from "../i18n/config.ts";

/** Date the guide was last checked (YYYY-MM-DD). Change it whenever the texts change. */
export const BOOKING_GUIDE_UPDATED = "2026-11-11";

export type GuideSection = {
  heading: string;
  paragraphs?: string[];
  items?: string[];
};

export type BookingPhrase = {
  /** The Korean sentence to show or read to the clinic. */
  ko: string;
  /** How to say it: Revised Romanization of the spoken form (예약할 is read 예야칼, so "yeyakal"). */
  romanized: string;
  /** What it means, in the viewer's language (English on the Korean page). */
  meaning: string;
  /** Set on the booking-date phrase: its meaning with {date} and {time}, used once the visitor picks them. */
  dateMeaning?: string;
};

export type BookingGuide = {
  title: string;
  intro: string;
  sections: GuideSection[];
  phrasesTitle: string;
  phrasesIntro: string;
  phrases: BookingPhrase[];
};

/** The Korean phrases; the second one names the viewer's language. */
function phrases(language: { ko: string; romanized: string }, meanings: string[], dateMeaning: string): BookingPhrase[] {
  const korean: [string, string][] = [
    ["안녕하세요. 외국인인데 예약하고 싶어요.", "Annyeonghaseyo. Oegugininde yeyakago sipeoyo."],
    [`${language.ko}로 상담할 수 있나요?`, `${language.romanized}ro sangdamhal su innayo?`],
    ["통역 서비스가 있나요?", "Tongyeok seobiseuga innayo?"],
    ["○월 ○일 ○시에 예약할 수 있나요?", "○-wol ○-il ○-si-e yeyakal su innayo?"],
    ["상담비와 시술 가격을 미리 알려 주실 수 있나요?", "Sangdambiwa sisul gagyeogeul miri allyeo jusil su innayo?"],
    [
      "한국 전화번호가 없어요. 카카오톡이나 이메일로 연락받을 수 있을까요?",
      "Hanguk jeonhwabeonhoga eopseoyo. Kakaotogina imeillo yeollakbadeul su isseulkkayo?",
    ],
    ["예약 없이 오늘 진료받을 수 있나요?", "Yeyak eopsi oneul jillyobadeul su innayo?"],
    ["예약을 바꾸고 싶어요.", "Yeyageul bakkugo sipeoyo."],
  ];
  if (meanings.length !== korean.length) throw new Error("booking guide: one meaning per phrase");
  return korean.map(([ko, romanized], i) => ({ ko, romanized, meaning: meanings[i], ...(i === DATE_PHRASE ? { dateMeaning } : {}) }));
}

/** Position of "○월 ○일 ○시에 예약할 수 있나요?" in the list. */
const DATE_PHRASE = 3;


const ENGLISH = { ko: "영어", romanized: "Yeong-eo" };

const EN_MEANINGS = [
  "Hello. I'm a foreigner and I'd like to make a booking.",
  "Can I have the consultation in English?",
  "Do you have an interpreter?",
  "Can I book for [month] [day] at [time]?",
  "Could you tell me the consultation fee and treatment price in advance?",
  "I don't have a Korean phone number. Could you contact me by KakaoTalk or email?",
  "Can I be seen today without a booking?",
  "I'd like to change my booking.",
];

const EN_DATE_MEANING = "Can I book for {date} at {time}?";

const EN: BookingGuide = {
  title: "How to book a clinic in Korea",
  intro:
    "Clinics in Korea usually take bookings by phone, through their website or a messenger app, or on Naver Map, and many also see patients without a booking. KONCI does not take bookings for you and receives no fees from clinics; this page only explains the usual ways. Each clinic has its own process, so always confirm with the clinic directly.",
  sections: [
    {
      heading: "Before you book",
      items: [
        "Check the address, phone number and website on the clinic's KONCI page.",
        "Look at the reviews to see whether staff speak English or an interpreter is available.",
        "Note the treatment you want and the dates and times that suit you.",
        "Bring your passport: clinics may ask for ID on your first visit.",
      ],
    },
    {
      heading: "Ways to book",
      items: [
        "Phone: the fastest way, but the call will usually be in Korean. Show the Korean phrases below or ask the 1330 hotline to help interpret.",
        "Website or messenger: clinics that see many foreign patients often take bookings on their website or through a KakaoTalk channel, Instagram, WhatsApp or LINE. Look for links on the clinic's website.",
        "Naver Map: if the clinic's Naver Map listing has a 'Booking' (예약) button, you can book there. You need a Naver account, and some steps may ask you to verify a Korean phone number.",
        "Walk in: many dermatology clinics see patients without a booking, but waits can be long and some treatments need a consultation first. Call ahead if you can.",
      ],
    },
    {
      heading: "Getting help with Korean",
      items: [
        "1330 Korea Travel Hotline: dial 1330 in Korea or +82-2-1330 from abroad. It helps interpret 24 hours a day in English, Japanese and Chinese, and you can also chat through KakaoTalk or LINE.",
        "Medical Korea Information Center: 1577-7129. Run by the Korea Health Industry Development Institute, it gives foreign patients information on using medical services in Korea and takes complaints. Check its hours on the official website.",
      ],
    },
    {
      heading: "Before your visit",
      items: [
        "Ask for the total price in advance, including the consultation fee and whether VAT is included.",
        "Ask about recovery time, aftercare and whether you need to come back.",
        "Check whether a deposit is needed and until when you can cancel or change the booking.",
        "Keep your receipt. You need it to write a receipt-verified review on KONCI.",
      ],
    },
    {
      heading: "Be careful",
      paragraphs: [
        "Be careful with people or agents who offer to book for you at a discount. Businesses that are paid to bring foreign patients to clinics must be registered with the Korean government.",
        "This guide is general information. Confirm the actual booking process, prices and conditions with the clinic.",
      ],
    },
  ],
  phrasesTitle: "Korean phrases to show the clinic",
  phrasesIntro: "Show the screen to the clinic staff or read the phrase aloud. Replace ○ with your own details.",
  phrases: phrases(ENGLISH, EN_MEANINGS, EN_DATE_MEANING),
};

const JA: BookingGuide = {
  title: "韓国の病院・皮膚科の予約方法",
  intro:
    "韓国の病院や皮膚科は、電話、ホームページ・メッセンジャー、NAVERマップで予約を受け付けることが多く、予約なしで受診できるところも少なくありません。KONCIは予約の代行や病院からの手数料の受け取りは行っておらず、このページでは一般的な方法だけをご案内します。予約方法や条件は病院ごとに異なるため、必ず病院に直接ご確認ください。",
  sections: [
    {
      heading: "予約の前に準備すること",
      items: [
        "KONCIの病院ページで住所、電話番号、ホームページを確認しましょう。",
        "レビューで英語対応や通訳の有無をチェックしましょう。",
        "受けたい診療や施術、希望の日時をまとめておきましょう。",
        "初診時に本人確認を求められることがあるので、パスポートを持参しましょう。",
      ],
    },
    {
      heading: "予約の方法",
      items: [
        "電話：最も早い方法ですが、通常は韓国語での通話になります。下の韓国語フレーズを見せるか、1330の通訳サービスを利用しましょう。",
        "ホームページ・メッセンジャー：外国人患者が多い病院では、ホームページ、カカオトークチャンネル、Instagram、WhatsApp、LINEで予約を受け付けることもあります。病院のホームページで案内を探してみましょう。",
        "NAVERマップ：NAVERマップの病院情報に「予約(예약)」ボタンがあれば、そこから予約できます。NAVERアカウントが必要で、韓国の携帯電話番号による認証を求められることがあります。",
        "予約なしで来院：予約なしで診療する皮膚科も多いですが、待ち時間が長くなることがあり、施術は先にカウンセリングが必要な場合があります。できれば事前に電話しましょう。",
      ],
    },
    {
      heading: "言葉のサポートを受ける",
      items: [
        "1330 観光通訳案内電話：韓国国内から1330、海外から+82-2-1330。英語・日本語・中国語は24時間通訳をサポートしており、カカオトークやLINEのチャットでも問い合わせできます。",
        "メディカルコリア情報センター：1577-7129。韓国保健産業振興院が運営し、外国人患者向けの医療利用情報の提供や苦情の受け付けを行っています。受付時間は公式サイトでご確認ください。",
      ],
    },
    {
      heading: "来院前に確認すること",
      items: [
        "カウンセリング料を含む総額と、付加価値税(VAT)が含まれているかを事前に確認しましょう。",
        "回復期間やアフターケア、再来院が必要かを確認しましょう。",
        "予約金の有無や、キャンセル・変更の期限を確認しましょう。",
        "領収書は必ず受け取りましょう。KONCIで領収書認証レビューを書くときに必要です。",
      ],
    },
    {
      heading: "ご注意ください",
      paragraphs: [
        "予約を代行して割引すると持ちかける個人や業者にはご注意ください。報酬を受けて外国人患者を病院に紹介する業者は、韓国政府への登録が必要です。",
        "この案内は一般的な情報です。実際の予約方法、料金、条件は病院に直接ご確認ください。",
      ],
    },
  ],
  phrasesTitle: "病院で見せる韓国語フレーズ",
  phrasesIntro: "画面を病院のスタッフに見せるか、声に出して読んでみましょう。○の部分は希望の内容に置き換えてください。",
  phrases: phrases({ ko: "일본어", romanized: "Ilboneo" }, [
    "こんにちは。外国人ですが、予約をしたいです。",
    "日本語でカウンセリングを受けられますか？",
    "通訳サービスはありますか？",
    "○月○日○時に予約できますか？",
    "カウンセリング料と施術の料金を事前に教えていただけますか？",
    "韓国の電話番号を持っていません。カカオトークかメールで連絡をもらえますか？",
    "予約なしで今日診てもらえますか？",
    "予約を変更したいです。",
  ], "{date} {time}に予約できますか？"),
};

const ZH: BookingGuide = {
  title: "如何预约韩国医院和皮肤科",
  intro:
    "韩国的医院和皮肤科通常通过电话、官网或聊天软件、NAVER 地图接受预约，也有很多诊所可以不预约直接就诊。KONCI 不代为预约，也不向诊所收取任何费用，本页只介绍一般的预约方式。各诊所的预约方式和条件不同，请务必直接向诊所确认。",
  sections: [
    {
      heading: "预约前的准备",
      items: [
        "在 KONCI 的诊所页面确认地址、电话和官网。",
        "通过评价了解是否有英语接待或翻译。",
        "整理好想做的诊疗或项目，以及方便的日期和时间。",
        "初次就诊时可能需要确认身份，请携带护照。",
      ],
    },
    {
      heading: "预约方式",
      items: [
        "电话：最快，但通常需要用韩语沟通。可以出示下方的韩语句子，或使用 1330 翻译服务。",
        "官网和聊天软件：外国患者较多的诊所也会通过官网、KakaoTalk 频道、Instagram、WhatsApp 或 LINE 接受预约。可以在诊所官网上找找相关链接。",
        "NAVER 地图：如果 NAVER 地图的诊所信息中有“预约(예약)”按钮，就可以直接预约。需要 NAVER 账号，有时还会要求用韩国手机号验证。",
        "不预约直接前往：很多皮肤科可以不预约就诊，但可能要等很久，有些项目需要先面诊。如果可以，最好先打电话确认。",
      ],
    },
    {
      heading: "获取语言帮助",
      items: [
        "1330 旅游咨询热线：在韩国拨打 1330，在海外拨打 +82-2-1330。英语、日语、中文提供 24 小时翻译帮助，也可以通过 KakaoTalk 或 LINE 聊天咨询。",
        "Medical Korea 信息中心：1577-7129。由韩国保健产业振兴院运营，为外国患者提供在韩就医信息并受理投诉。服务时间请在官网确认。",
      ],
    },
    {
      heading: "就诊前要确认的事项",
      items: [
        "提前询问包括面诊费在内的总费用，以及是否含增值税。",
        "确认恢复期、术后护理以及是否需要复诊。",
        "确认是否需要预付定金，以及取消或改期的截止时间。",
        "请务必索取收据。在 KONCI 写收据认证评价时需要用到。",
      ],
    },
    {
      heading: "注意事项",
      paragraphs: [
        "请小心声称可以代为预约并提供折扣的个人或中介。收取费用为外国患者介绍医院的机构必须在韩国政府登记。",
        "本指南仅为一般信息，实际预约方式、价格和条件请直接向诊所确认。",
      ],
    },
  ],
  phrasesTitle: "给诊所看的韩语句子",
  phrasesIntro: "把屏幕给诊所工作人员看，或试着读出来。○ 的部分请换成你需要的内容。",
  phrases: phrases({ ko: "중국어", romanized: "Junggugeo" }, [
    "您好，我是外国人，想预约。",
    "可以用中文面诊吗？",
    "有翻译服务吗？",
    "可以预约○月○日○点吗？",
    "可以提前告诉我面诊费和项目价格吗？",
    "我没有韩国手机号。可以通过 KakaoTalk 或邮件联系我吗？",
    "不预约的话，今天可以看诊吗？",
    "我想改一下预约。",
  ], "可以预约{date} {time}吗？"),
};

const KO: BookingGuide = {
  title: "한국 병원·피부과 예약하는 방법",
  intro:
    "한국의 병원과 피부과는 보통 전화, 홈페이지·메신저, 네이버 지도로 예약을 받고, 예약 없이 방문해도 되는 곳도 많습니다. KONCI는 예약을 대신 받거나 병원에서 수수료를 받지 않으며, 이 페이지는 일반적인 방법만 안내합니다. 예약 방법과 조건은 병원마다 다르니 꼭 병원에 직접 확인하세요.",
  sections: [
    {
      heading: "예약 전에 준비할 것",
      items: [
        "KONCI 병원 페이지에서 주소, 전화번호, 홈페이지를 확인하세요.",
        "후기에서 영어 응대와 통역 여부를 살펴보세요.",
        "받고 싶은 진료나 시술, 가능한 날짜와 시간을 정리해 두세요.",
        "첫 방문 때 신분 확인을 요청할 수 있으니 여권을 챙기세요.",
      ],
    },
    {
      heading: "예약하는 방법",
      items: [
        "전화: 가장 빠르지만 대개 한국어로 통화합니다. 아래 한국어 문장을 보여 주거나 1330 통역 서비스의 도움을 받으세요.",
        "홈페이지·메신저: 외국인 환자가 많은 병원은 홈페이지, 카카오톡 채널, 인스타그램, 왓츠앱, 라인으로 예약을 받기도 합니다. 병원 홈페이지에서 연결 링크를 찾아보세요.",
        "네이버 지도: 네이버 지도의 병원 정보에 '예약' 버튼이 있으면 바로 예약할 수 있습니다. 네이버 계정이 필요하고, 한국 휴대폰 번호 인증을 요구할 수 있습니다.",
        "예약 없이 방문: 예약 없이 진료하는 피부과도 많지만 오래 기다릴 수 있고, 시술은 상담을 먼저 받아야 할 수 있습니다. 가능하면 미리 전화해 보세요.",
      ],
    },
    {
      heading: "언어 도움 받기",
      items: [
        "1330 관광통역안내전화: 한국에서 1330, 해외에서 +82-2-1330. 영어·일본어·중국어는 24시간 통역을 도와주고, 카카오톡·라인 채팅으로도 문의할 수 있습니다.",
        "메디컬코리아 정보센터: 1577-7129. 한국보건산업진흥원이 운영하며, 외국인 환자에게 국내 의료 이용 정보를 안내하고 불편 사항을 접수합니다. 운영 시간은 공식 홈페이지에서 확인하세요.",
      ],
    },
    {
      heading: "방문 전에 확인할 것",
      items: [
        "상담비를 포함한 총비용과 부가세 포함 여부를 미리 물어보세요.",
        "회복 기간, 사후 관리, 다시 방문해야 하는지 확인하세요.",
        "예약금이 있는지, 취소나 변경은 언제까지 가능한지 확인하세요.",
        "영수증을 꼭 받아 두세요. KONCI에서 영수증 인증 후기를 쓸 때 필요합니다.",
      ],
    },
    {
      heading: "주의하세요",
      paragraphs: [
        "대신 예약해 주고 할인해 주겠다는 개인이나 업체를 조심하세요. 돈을 받고 외국인 환자를 병원에 연결하는 업체는 한국 정부에 등록해야 합니다.",
        "이 안내는 일반적인 정보입니다. 실제 예약 방법, 가격, 조건은 병원에 직접 확인하세요.",
      ],
    },
  ],
  phrasesTitle: "병원에 보여 줄 한국어 문장",
  phrasesIntro: "병원 직원에게 화면을 보여 주거나 소리 내어 읽어 보세요. ○ 부분은 원하는 내용으로 바꿔 말하세요. 외국인 친구에게 알려 줄 수 있도록 영어 뜻을 함께 적었습니다.",
  phrases: phrases(ENGLISH, EN_MEANINGS, EN_DATE_MEANING),
};

const GUIDES: Record<Locale, BookingGuide> = { en: EN, ja: JA, zh: ZH, ko: KO };

export function getBookingGuide(lang: Locale): BookingGuide {
  return GUIDES[lang];
}
