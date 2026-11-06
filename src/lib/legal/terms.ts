import type { Locale } from "../../i18n/config.ts";
import type { LegalDoc } from "./types.ts";

// The Korean text is the reference version. Keep the four versions in step.

const ko: LegalDoc = {
  title: "이용약관",
  intro:
    "이 약관은 MediMate(이하 \"서비스\")를 이용하는 데 필요한 서비스 운영자(이하 \"운영자\")와 이용자의 권리, 의무, 책임을 정합니다. 서비스를 이용하면 이 약관에 동의한 것으로 봅니다.",
  sections: [
    {
      heading: "1. 서비스의 내용",
      paragraphs: [
        "서비스는 한국의 병원·의원 정보를 찾아보고, 진료비 영수증으로 방문을 확인한 이용자가 쓴 후기를 공유하는 플랫폼입니다. 병원 정보는 건강보험심사평가원의 공공데이터(공공누리 제1유형)와 이용자·병원 관리자의 수정 요청을 바탕으로 하며, 실제와 다를 수 있습니다.",
      ],
    },
    {
      heading: "2. 의료 정보에 관한 고지",
      items: [
        "서비스는 의료 행위나 진단, 치료, 처방을 제공하지 않으며, 의사의 진료를 대신하지 않습니다.",
        "후기는 개인의 경험이며 결과는 사람마다 다를 수 있습니다. 진료 내용, 비용, 예약 조건은 반드시 병원에 직접 확인하세요.",
        "서비스는 특정 병원을 추천하거나 병원과 이용자 사이의 진료·계약에 관여하지 않으며, 그에 따른 분쟁의 당사자가 아닙니다.",
      ],
    },
    {
      heading: "3. 회원 가입과 계정",
      items: [
        "회원 가입은 Google 계정 또는 이메일 로그인으로 합니다. 로그인할 때 만 14세 이상임을 확인해야 하며, 만 14세 미만은 가입할 수 없습니다.",
        "계정 관리의 책임은 이용자에게 있으며, 다른 사람에게 계정을 양도하거나 빌려줄 수 없습니다.",
        "\"내 정보\" 화면에서 직접 탈퇴할 수 있으며, 탈퇴하면 정보는 개인정보처리방침에 따라 삭제됩니다.",
      ],
    },
    {
      heading: "4. 후기 작성 규칙",
      items: [
        "후기는 이용자가 직접 병원을 이용하고 받은 본인의 영수증으로 확인된 경우에만 쓸 수 있습니다. 영수증은 본인의 것이어야 하며 위조·변조·타인 명의의 사용은 금지됩니다.",
        "하나의 영수증으로 하나의 후기를 쓸 수 있습니다.",
        "사실과 본인의 경험을 바탕으로 쓰고, 병원에서 금전이나 혜택을 받고 쓴 글, 병원이나 경쟁 병원의 관계자가 쓴 글은 올릴 수 없습니다.",
        "다음 내용은 올릴 수 없으며, 올라온 경우 숨김 또는 삭제될 수 있습니다: 거짓 정보, 타인에 대한 비방·모욕, 개인정보(타인의 이름·연락처 등) 노출, 광고·홍보, 음란·폭력·차별적 표현, 저작권 등 타인의 권리 침해, 서비스와 관계없는 내용.",
      ],
    },
    {
      heading: "5. 이용자 콘텐츠의 권리",
      paragraphs: [
        "후기 등 이용자가 올린 콘텐츠의 저작권은 이용자에게 있습니다. 다만 이용자는 운영자에게 서비스를 운영·홍보하기 위해 필요한 범위에서(서비스 화면과 검색 결과 노출, 4개 언어로의 번역·요약 포함) 이 콘텐츠를 무상으로, 서비스 이용 기간 동안 사용할 수 있는 권리를 줍니다. 이용자가 후기를 삭제하면 서비스 화면에서 내려갑니다.",
      ],
    },
    {
      heading: "6. 신고와 게시물 조치",
      items: [
        "누구든 규칙에 어긋난다고 생각하는 후기를 신고할 수 있습니다.",
        "병원이나 제3자가 자신의 권리를 침해한다고 주장하며 요청하면, 운영자는 해당 게시물을 임시로 숨기고(임시조치) 이용자에게 알릴 수 있습니다.",
        "운영자는 규칙을 어긴 후기를 숨기거나 삭제하고, 반복되는 위반에는 계정 이용을 정지할 수 있습니다.",
      ],
    },
    {
      heading: "7. 병원 관리자",
      items: [
        "병원 관계자는 증빙을 내고 심사를 거쳐 해당 병원의 관리자가 될 수 있습니다.",
        "관리자도 후기를 삭제하거나 숨길 수 없으며, 부적절한 후기는 신고만 할 수 있습니다. 관리자가 요청한 정보 수정은 운영자의 검토를 거쳐 반영됩니다.",
        "행사, 가격 등 홍보성 문구는 등록할 수 없습니다.",
      ],
    },
    {
      heading: "8. 금지 행위",
      items: [
        "다른 사람의 계정이나 영수증 사용, 허위 영수증 제출",
        "자동화된 수단으로 서비스를 대량 수집(크롤링)하거나 서비스 운영을 방해하는 행위",
        "서비스의 보안을 우회하거나 취약점을 악용하는 행위",
        "운영자나 다른 이용자를 사칭하는 행위",
        "법령이나 이 약관을 어기는 그 밖의 행위",
      ],
    },
    {
      heading: "9. 서비스의 변경과 중단",
      paragraphs: ["운영자는 서비스의 전부 또는 일부를 바꾸거나 중단할 수 있으며, 중요한 변경은 사전에 알립니다. 점검, 장애, 천재지변 등 불가피한 사유로는 사전 고지 없이 일시 중단될 수 있습니다."],
    },
    {
      heading: "10. 책임의 제한",
      items: [
        "서비스는 \"있는 그대로\" 제공되며, 병원 정보와 후기의 정확성, 완전성, 최신성을 보증하지 않습니다.",
        "이용자가 서비스의 정보에 의존하여 내린 결정과 병원 이용으로 생긴 손해에 대해, 운영자의 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.",
        "이용자 사이 또는 이용자와 병원 사이의 분쟁에 대해 운영자는 개입할 의무가 없습니다.",
        "법령이 허용하지 않는 범위에서는 위 제한이 적용되지 않으며, 소비자의 권리를 제한하지 않습니다.",
      ],
    },
    {
      heading: "11. 광고와 수수료",
      paragraphs: ["운영자는 앞으로 병원 광고 등을 도입할 수 있습니다. 광고는 후기·평점과 구분해 표시하며, 광고나 대가를 받았는지가 후기의 순위·내용에 영향을 주지 않도록 합니다. 새로 도입할 때에는 이 약관에 반영하고 사전에 알립니다."],
    },
    {
      heading: "12. 약관의 변경",
      paragraphs: ["약관을 바꿀 때는 시행 7일 전부터 서비스 화면에 알립니다. 이용자에게 불리한 변경은 30일 전에 알리며, 이용자가 시행일까지 거부 의사를 밝히지 않고 서비스를 계속 이용하면 동의한 것으로 봅니다."],
    },
    {
      heading: "13. 준거법과 관할, 문의",
      paragraphs: [
        "이 약관은 대한민국 법을 따르며, 서비스와 관련한 분쟁은 민사소송법이 정한 관할 법원에서 다룹니다. 다만 이용자가 해외에 거주하는 소비자인 경우 그 나라의 강행 규정이 정한 소비자 보호는 그대로 적용됩니다.",
        "문의: {contact}",
      ],
    },
  ],
};

const en: LegalDoc = {
  title: "Terms of Service",
  intro:
    "These terms set out the rights, duties and responsibilities between the operator of MediMate (the \"Service\", the \"Operator\") and its users. By using the Service you agree to these terms.",
  sections: [
    {
      heading: "1. What the Service is",
      paragraphs: [
        "The Service lets you look up hospitals and clinics in Korea and read reviews from people whose visit was confirmed by a medical receipt. Clinic information is based on public data from the Health Insurance Review & Assessment Service (KOGL Type 1) and on correction requests from users and clinic managers, and it may differ from reality.",
      ],
    },
    {
      heading: "2. Medical information notice",
      items: [
        "The Service does not provide medical care, diagnosis, treatment or prescriptions and does not replace a doctor.",
        "Reviews are personal experiences and results vary from person to person. Always confirm treatment, prices and booking conditions directly with the clinic.",
        "The Service does not recommend any particular clinic, takes no part in treatment or contracts between you and a clinic, and is not a party to any dispute that arises from them.",
      ],
    },
    {
      heading: "3. Accounts",
      items: [
        "You sign up by signing in with a Google account or an email link. You confirm that you are 14 or older when you sign in, and you must be 14 or older to join.",
        "You are responsible for your account and may not transfer or lend it to anyone else.",
        "You can delete your account yourself on the \"My page\" screen; what happens to your information is described in the Privacy Policy.",
      ],
    },
    {
      heading: "4. Review rules",
      items: [
        "You can write a review only when your own visit is confirmed by your own receipt. The receipt must be yours; forged, altered or someone else's receipts are not allowed.",
        "One receipt supports one review.",
        "Write from fact and your own experience. Posts written in return for money or benefits from a clinic, or by people connected to a clinic or its competitors, are not allowed.",
        "The following may not be posted and may be hidden or deleted: false information, insults or defamation of others, personal information of others (names, contact details), advertising or promotion, obscene, violent or discriminatory content, infringement of copyright or other rights, and content unrelated to the Service.",
      ],
    },
    {
      heading: "5. Rights in your content",
      paragraphs: [
        "You keep the copyright in what you post, such as reviews. You give the Operator a free license, for as long as you use the Service, to use it as needed to run and promote the Service, including showing it in the Service and in search results and translating or summarizing it in the four supported languages. When you delete a review it is taken off the Service.",
      ],
    },
    {
      heading: "6. Reports and actions on posts",
      items: [
        "Anyone can report a review they think breaks the rules.",
        "If a clinic or other third party says a post infringes their rights, the Operator may hide it temporarily (a temporary measure) and tell the author.",
        "The Operator may hide or delete reviews that break the rules and may suspend accounts for repeated violations.",
      ],
    },
    {
      heading: "7. Clinic managers",
      items: [
        "Clinic staff can become managers of their clinic by submitting proof and passing review.",
        "Managers cannot delete or hide reviews; they can only report inappropriate ones. Changes to clinic information that a manager requests are applied after the Operator reviews them.",
        "Promotional text such as events or prices may not be added.",
      ],
    },
    {
      heading: "8. Prohibited conduct",
      items: [
        "Using someone else's account or receipt, or submitting a false receipt",
        "Collecting the Service in bulk by automated means (scraping) or interfering with its operation",
        "Bypassing security or abusing vulnerabilities",
        "Impersonating the Operator or other users",
        "Anything else that breaks the law or these terms",
      ],
    },
    {
      heading: "9. Changes and interruptions",
      paragraphs: ["The Operator may change or stop all or part of the Service and will give notice of significant changes in advance. The Service may be paused without notice for maintenance, outages, natural disasters or other unavoidable reasons."],
    },
    {
      heading: "10. Limits of liability",
      items: [
        "The Service is provided \"as is\" and does not guarantee that clinic information or reviews are accurate, complete or current.",
        "The Operator is not liable for decisions you make relying on the Service or for harm arising from using a clinic, unless caused by the Operator's intent or gross negligence.",
        "The Operator has no duty to step into disputes between users or between a user and a clinic.",
        "These limits do not apply where the law does not allow them and do not reduce your rights as a consumer.",
      ],
    },
    {
      heading: "11. Advertising and fees",
      paragraphs: ["The Operator may introduce clinic advertising in the future. Ads will be shown separately from reviews and ratings, and whether a clinic pays will not affect the ranking or content of reviews. Anything new will be added to these terms with prior notice."],
    },
    {
      heading: "12. Changes to these terms",
      paragraphs: ["We announce changes in the Service at least 7 days before they take effect, and at least 30 days before changes that are less favorable to you. If you keep using the Service after the effective date without objecting, you are treated as having agreed."],
    },
    {
      heading: "13. Governing law, courts and contact",
      paragraphs: [
        "These terms are governed by the laws of the Republic of Korea, and disputes about the Service go to the court with jurisdiction under the Korean Civil Procedure Act. If you are a consumer living abroad, the mandatory consumer protections of your country still apply.",
        "Contact: {contact}",
      ],
    },
  ],
};

const ja: LegalDoc = {
  title: "利用規約",
  intro:
    "本規約は、MediMate(以下「本サービス」)の運営者(以下「運営者」)と利用者との間の権利、義務、責任を定めるものです。本サービスを利用することで、本規約に同意したものとみなします。",
  sections: [
    {
      heading: "1. サービスの内容",
      paragraphs: [
        "本サービスは、韓国の病院・クリニックの情報を探し、診療費領収書で受診が確認された利用者の口コミを共有するプラットフォームです。医療機関の情報は、健康保険審査評価院の公共データ(公共ヌリ第1類型)と、利用者・医療機関管理者の修正リクエストに基づいており、実際と異なる場合があります。",
      ],
    },
    {
      heading: "2. 医療情報に関するご案内",
      items: [
        "本サービスは医療行為、診断、治療、処方を提供せず、医師の診察に代わるものではありません。",
        "口コミは個人の体験であり、結果には個人差があります。診療内容、費用、予約条件は必ず医療機関に直接ご確認ください。",
        "本サービスは特定の医療機関を推薦せず、利用者と医療機関との診療・契約には関与せず、それに伴う紛争の当事者にもなりません。",
      ],
    },
    {
      heading: "3. 会員登録とアカウント",
      items: [
        "会員登録はGoogleアカウントまたはメールでのログインにより行います。ログイン時に14歳以上であることを確認していただく必要があり、14歳未満の方は登録できません。",
        "アカウントの管理は利用者の責任で行い、他人に譲渡・貸与することはできません。",
        "退会は「マイページ」から自分で行えます。情報の扱いはプライバシーポリシーに従います。",
      ],
    },
    {
      heading: "4. 口コミのルール",
      items: [
        "口コミは、利用者自身が受診し、本人の領収書で受診が確認された場合にのみ投稿できます。領収書は本人のものである必要があり、偽造・改ざん・他人名義の使用は禁止です。",
        "1枚の領収書につき、1件の口コミを投稿できます。",
        "事実と自身の体験に基づいて書いてください。医療機関から金銭や特典を受けて書いた投稿、医療機関や競合の関係者による投稿はできません。",
        "次の内容は投稿できず、投稿された場合は非表示または削除されることがあります:虚偽の情報、他者への誹謗中傷、他者の個人情報(氏名・連絡先など)の掲載、広告・宣伝、わいせつ・暴力・差別的な表現、著作権などの権利侵害、本サービスと無関係な内容。",
      ],
    },
    {
      heading: "5. 利用者コンテンツの権利",
      paragraphs: [
        "口コミなど利用者が投稿したコンテンツの著作権は利用者に帰属します。ただし利用者は運営者に対し、サービスの運営・宣伝に必要な範囲(サービス画面や検索結果への表示、4言語への翻訳・要約を含む)で、利用期間中、無償でこのコンテンツを使用する権利を与えます。口コミを削除すると、サービス上から削除されます。",
      ],
    },
    {
      heading: "6. 通報と投稿への措置",
      items: [
        "どなたでも、ルールに反すると思う口コミを通報できます。",
        "医療機関や第三者が権利侵害を主張して求めた場合、運営者はその投稿を一時的に非表示にし(一時措置)、投稿者に知らせることがあります。",
        "運営者は、ルールに反する口コミを非表示または削除し、違反が繰り返される場合はアカウントの利用を停止することがあります。",
      ],
    },
    {
      heading: "7. 医療機関管理者",
      items: [
        "医療機関の関係者は、証明書類を提出し審査を経て、その医療機関の管理者になれます。",
        "管理者も口コミを削除・非表示にすることはできず、不適切な口コミを通報することのみできます。管理者が求めた情報の修正は、運営者の審査を経て反映されます。",
        "イベントや価格などの宣伝文は登録できません。",
      ],
    },
    {
      heading: "8. 禁止行為",
      items: [
        "他人のアカウントや領収書の使用、虚偽の領収書の提出",
        "自動化された手段による本サービスの大量収集(クローリング)、またはサービス運営の妨害",
        "セキュリティの回避や脆弱性の悪用",
        "運営者や他の利用者へのなりすまし",
        "その他、法令または本規約に違反する行為",
      ],
    },
    {
      heading: "9. サービスの変更と中断",
      paragraphs: ["運営者は本サービスの全部または一部を変更・中断することがあり、重要な変更は事前にお知らせします。メンテナンス、障害、天災などやむを得ない事由により、事前の告知なく一時的に中断することがあります。"],
    },
    {
      heading: "10. 責任の制限",
      items: [
        "本サービスは「現状のまま」提供され、医療機関の情報や口コミの正確性、完全性、最新性を保証しません。",
        "利用者が本サービスの情報に基づいて行った判断や、医療機関の利用により生じた損害について、運営者の故意または重大な過失がない限り責任を負いません。",
        "利用者間、または利用者と医療機関との間の紛争に、運営者が介入する義務はありません。",
        "法令が認めない範囲では上記の制限は適用されず、消費者の権利を制限するものではありません。",
      ],
    },
    {
      heading: "11. 広告と手数料",
      paragraphs: ["運営者は今後、医療機関の広告などを導入することがあります。広告は口コミ・評価と区別して表示し、広告や対価の有無が口コミの順位や内容に影響しないようにします。新たに導入する際は本規約に反映し、事前にお知らせします。"],
    },
    {
      heading: "12. 規約の変更",
      paragraphs: ["規約を変更する場合は、施行の7日前からサービス上でお知らせします。利用者に不利な変更は30日前にお知らせし、施行日までに拒否の意思を示さず利用を続けた場合は同意したものとみなします。"],
    },
    {
      heading: "13. 準拠法、管轄、お問い合わせ",
      paragraphs: [
        "本規約は大韓民国の法律に準拠し、本サービスに関する紛争は、民事訴訟法が定める管轄裁判所で扱います。ただし、海外在住の消費者の場合は、その国の強行規定による消費者保護が引き続き適用されます。",
        "お問い合わせ: {contact}",
      ],
    },
  ],
};

const zh: LegalDoc = {
  title: "服务条款",
  intro:
    "本条款规定 MediMate(以下简称“本服务”)的运营者(以下简称“运营者”)与用户之间的权利、义务和责任。使用本服务即视为同意本条款。",
  sections: [
    {
      heading: "1. 服务内容",
      paragraphs: [
        "本服务是一个让用户查找韩国医院和诊所信息,并阅读通过医疗收据确认就诊的用户所写评价的平台。医院信息基于健康保险审查评价院的公共数据(公共 Nuri 第 1 类)以及用户和医院管理员的更正请求,可能与实际情况不符。",
      ],
    },
    {
      heading: "2. 医疗信息声明",
      items: [
        "本服务不提供医疗行为、诊断、治疗或处方,也不能替代医生的诊疗。",
        "评价是个人经历,结果因人而异。诊疗内容、费用和预约条件请务必直接向医院确认。",
        "本服务不推荐任何特定医院,不参与您与医院之间的诊疗或合同,也不是由此产生的任何纠纷的当事方。",
      ],
    },
    {
      heading: "3. 注册与账号",
      items: [
        "注册通过 Google 账号或电子邮箱登录完成。登录时需确认已年满 14 周岁,未满 14 周岁者不得注册。",
        "账号由用户自行负责管理,不得转让或出借给他人。",
        "您可以在“我的页面”自行注销账号,信息的处理方式见《隐私政策》。",
      ],
    },
    {
      heading: "4. 评价规则",
      items: [
        "仅当用户本人就诊并通过本人收据得到确认时,才可撰写评价。收据必须是本人的,禁止伪造、篡改或使用他人名义的收据。",
        "一张收据只能撰写一条评价。",
        "请基于事实和本人经历撰写。禁止发布从医院获得金钱或好处后所写的内容,以及与医院或其竞争对手有关联的人所写的内容。",
        "以下内容不得发布,已发布的可能被隐藏或删除:虚假信息、对他人的诽谤和侮辱、泄露他人个人信息(姓名、联系方式等)、广告或推广、淫秽、暴力或歧视性内容、侵犯著作权等他人权利、与本服务无关的内容。",
      ],
    },
    {
      heading: "5. 用户内容的权利",
      paragraphs: [
        "评价等用户发布内容的著作权归用户所有。但用户授予运营者在使用本服务期间,为运营和推广服务所必需的范围内(包括在服务页面和搜索结果中展示,以及翻译或概述为四种语言)免费使用该内容的权利。用户删除评价后,该评价将从服务中撤下。",
      ],
    },
    {
      heading: "6. 举报与内容处理",
      items: [
        "任何人都可以举报其认为违反规则的评价。",
        "如医院或其他第三方主张内容侵犯其权利并提出请求,运营者可以暂时隐藏该内容(临时措施)并通知作者。",
        "运营者可以隐藏或删除违反规则的评价,对反复违规的账号可以暂停使用。",
      ],
    },
    {
      heading: "7. 医院管理员",
      items: [
        "医院相关人员提交证明并通过审核后,可成为该医院的管理员。",
        "管理员同样不能删除或隐藏评价,只能举报不当评价。管理员请求修改的医院信息,须经运营者审核后才会生效。",
        "不得添加活动、价格等宣传性文字。",
      ],
    },
    {
      heading: "8. 禁止行为",
      items: [
        "使用他人账号或收据,或提交虚假收据",
        "以自动化方式批量抓取本服务,或妨碍服务运行",
        "绕过安全措施或利用漏洞",
        "冒充运营者或其他用户",
        "其他违反法律或本条款的行为",
      ],
    },
    {
      heading: "9. 服务的变更与中断",
      paragraphs: ["运营者可以变更或中止全部或部分服务,重要变更会提前通知。因维护、故障、自然灾害等不可避免的原因,服务可能在不事先通知的情况下暂时中断。"],
    },
    {
      heading: "10. 责任限制",
      items: [
        "本服务按“现状”提供,不保证医院信息和评价的准确、完整或最新。",
        "对于用户依据本服务信息作出的决定,以及使用医院服务造成的损害,除非因运营者的故意或重大过失,运营者不承担责任。",
        "运营者没有义务介入用户之间,或用户与医院之间的纠纷。",
        "法律不允许的范围内,上述限制不适用,也不限制消费者的权利。",
      ],
    },
    {
      heading: "11. 广告与费用",
      paragraphs: ["运营者今后可能引入医院广告等。广告将与评价和评分分开展示,是否付费不会影响评价的排序或内容。新增内容时会写入本条款并提前通知。"],
    },
    {
      heading: "12. 条款的变更",
      paragraphs: ["修改条款时,我们会在生效前至少 7 天在服务中公告;对用户不利的修改将提前至少 30 天公告。如用户在生效日前未表示反对而继续使用,则视为同意。"],
    },
    {
      heading: "13. 适用法律、管辖与联系方式",
      paragraphs: [
        "本条款适用大韩民国法律,与本服务有关的争议由《民事诉讼法》规定的有管辖权的法院处理。但如用户是居住在海外的消费者,其所在国强制性规定中的消费者保护仍然适用。",
        "联系方式:{contact}",
      ],
    },
  ],
};

export const TERMS: Record<Locale, LegalDoc> = { ko, en, ja, zh };
