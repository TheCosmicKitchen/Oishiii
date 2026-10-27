// ===== Kana Garden — content data =====
// Kana beds follow the gojūon rows. Each kana has a hint word with a Fluent Emoji.
const ROWS = [
  { id: "a",  name: "あ", ro: "a",  kana: [["あ","a"],["い","i"],["う","u"],["え","e"],["お","o"]] },
  { id: "ka", name: "か", ro: "ka", kana: [["か","ka"],["き","ki"],["く","ku"],["け","ke"],["こ","ko"]] },
  { id: "sa", name: "さ", ro: "sa", kana: [["さ","sa"],["し","shi"],["す","su"],["せ","se"],["そ","so"]] },
  { id: "ta", name: "た", ro: "ta", kana: [["た","ta"],["ち","chi"],["つ","tsu"],["て","te"],["と","to"]] },
  { id: "na", name: "な", ro: "na", kana: [["な","na"],["に","ni"],["ぬ","nu"],["ね","ne"],["の","no"]] },
  { id: "ha", name: "は", ro: "ha", kana: [["は","ha"],["ひ","hi"],["ふ","fu"],["へ","he"],["ほ","ho"]] },
  { id: "ma", name: "ま", ro: "ma", kana: [["ま","ma"],["み","mi"],["む","mu"],["め","me"],["も","mo"]] },
  { id: "ya", name: "や", ro: "ya", kana: [["や","ya"],["ゆ","yu"],["よ","yo"]] },
  { id: "ra", name: "ら", ro: "ra", kana: [["ら","ra"],["り","ri"],["る","ru"],["れ","re"],["ろ","ro"]] },
  { id: "wa", name: "わ", ro: "wa", kana: [["わ","wa"],["を","o"],["ん","n"]] },
];

// hint words: kana -> [word, romaji, meaning, emoji]
const HINTS = {
  "あ":["あり","ari","ant","ant"], "い":["いぬ","inu","dog","dog"], "う":["うし","ushi","cow","cow"],
  "え":["えび","ebi","shrimp","shrimp"], "お":["おにぎり","onigiri","rice ball","riceball"],
  "か":["かに","kani","crab","crab"], "き":["きのこ","kinoko","mushroom","mushroom"], "く":["くま","kuma","bear","bear"],
  "け":["けむし","kemushi","caterpillar","bug"], "こ":["こおり","koori","ice","ice"],
  "さ":["さかな","sakana","fish","fish"], "し":["しか","shika","deer","deer"], "す":["すし","sushi","sushi","sushi"],
  "せ":["せんべい","senbei","rice cracker","ricecracker"], "そ":["そり","sori","sled","sled"],
  "た":["たこ","tako","octopus","octopus"], "ち":["ちず","chizu","map","map"], "つ":["つき","tsuki","moon","moon"],
  "て":["てがみ","tegami","letter","envelope"], "と":["とり","tori","bird","bird"],
  "な":["なす","nasu","eggplant","eggplant"], "に":["にんじん","ninjin","carrot","carrot"], "ぬ":["ぬいぐるみ","nuigurumi","plush toy","teddy"],
  "ね":["ねこ","neko","cat","cat"], "の":["のこぎり","nokogiri","saw","saw"],
  "は":["はな","hana","flower","sakura"], "ひ":["ひよこ","hiyoko","chick","chick"], "ふ":["ふね","fune","boat","sailboat"],
  "へ":["へび","hebi","snake","snake"], "ほ":["ほし","hoshi","star","star"],
  "ま":["まめ","mame","beans","beans"], "み":["みかん","mikan","mandarin orange","tangerine"], "む":["むし","mushi","bug","ladybug"],
  "め":["めがね","megane","glasses","glasses"], "も":["もも","momo","peach","peach"],
  "や":["やま","yama","mountain","mountain"], "ゆ":["ゆびわ","yubiwa","ring","ring"], "よ":["よる","yoru","night","night"],
  "ら":["らくだ","rakuda","camel","camel"], "り":["りんご","ringo","apple","apple"], "る":["くるま","kuruma","car (る in the middle)","car"],
  "れ":["れもん","remon","lemon","lemon"], "ろ":["ろうそく","rousoku","candle","candle"],
  "わ":["わに","wani","crocodile","croc"], "を":["すしをたべる","sushi o taberu","particle: marks the object","link"], "ん":["ほん","hon","book (ends in ん)","books"],
};

// Vocabulary. k = kanji, r = kana reading, ro = romaji, en = meaning, e = emoji key, t = theme
// Readings that use only basic kana can be made in the Kanji Pot.
const WORDS = [
  // nature
  ["山","やま","yama","mountain","mountain","nature"], ["川","かわ","kawa","river","river","nature"],
  ["木","き","ki","tree","tree","nature"], ["花","はな","hana","flower","blossom","nature"],
  ["森","もり","mori","forest","evergreen","nature"], ["空","そら","sora","sky","sky","nature"],
  ["雨","あめ","ame","rain","rain","nature"], ["雪","ゆき","yuki","snow","snowflake","nature"],
  ["火","ひ","hi","fire","fire","nature"], ["日","ひ","hi","sun, day","sun","nature"],
  ["月","つき","tsuki","moon","moon","nature"], ["星","ほし","hoshi","star","star","nature"],
  ["石","いし","ishi","stone","rock","nature"], ["草","くさ","kusa","grass","herb","nature"],
  ["竹","たけ","take","bamboo","bamboo","nature"], ["田","た","ta","rice field","rice","nature"],
  ["庭","にわ","niwa","garden","garden","nature"], ["春","はる","haru","spring","tulip","nature"],
  ["夏","なつ","natsu","summer","beach","nature"], ["秋","あき","aki","autumn","maple","nature"],
  ["冬","ふゆ","fuyu","winter","snowman","nature"], ["水","みず","mizu","water","droplet","nature"],
  // body & people
  ["目","め","me","eye","eye","people"], ["耳","みみ","mimi","ear","ear","people"],
  ["口","くち","kuchi","mouth","mouth","people"], ["手","て","te","hand","hand","people"],
  ["足","あし","ashi","foot, leg","foot","people"], ["鼻","はな","hana","nose","nose","people"],
  ["人","ひと","hito","person","person","people"], ["子","こ","ko","child","child","people"],
  ["兄","あに","ani","older brother","boy","people"], ["姉","あね","ane","older sister","girl","people"],
  ["顔","かお","kao","face","smile","people"], ["声","こえ","koe","voice","speaking","people"],
  ["愛","あい","ai","love","heart","people"],
  // animals
  ["犬","いぬ","inu","dog","dog","animals"], ["猫","ねこ","neko","cat","cat","animals"],
  ["鳥","とり","tori","bird","bird","animals"], ["魚","さかな","sakana","fish","fish","animals"],
  ["虫","むし","mushi","bug","bug","animals"], ["馬","うま","uma","horse","horse","animals"],
  ["牛","うし","ushi","cow","cow","animals"], ["猿","さる","saru","monkey","monkey","animals"],
  ["貝","かい","kai","shellfish","shell","animals"], ["亀","かめ","kame","turtle","turtle","animals"],
  ["兎","うさぎ","usagi","rabbit","rabbit","animals"], ["豚","ぶた","buta","pig","pig","animals"],
  // food
  ["肉","にく","niku","meat","meat","food"], ["酒","さけ","sake","sake, alcohol","sake","food"],
  ["塩","しお","shio","salt","salt","food"], ["卵","たまご","tamago","egg","egg","food"],
  ["米","こめ","kome","rice (uncooked)","cookedrice","food"], ["茶","ちゃ","cha","tea","teacup","food"],
  ["牛肉","ぎゅうにく","gyuuniku","beef","meat","food"], ["弁当","べんとう","bentou","boxed lunch","bento","food"],
  ["寿司","すし","sushi","sushi","sushi","food"], ["団子","だんご","dango","dumplings on a stick","dango","food"],
  ["魚","さかな","sakana","fish","fish","food"],
  // places & things
  ["家","いえ","ie","house","house","things"], ["店","みせ","mise","shop","store","things"],
  ["町","まち","machi","town","houses","things"], ["道","みち","michi","road","road","things"],
  ["駅","えき","eki","station","station","things"], ["車","くるま","kuruma","car","car","things"],
  ["船","ふね","fune","ship","ship","things"], ["本","ほん","hon","book","books","things"],
  ["紙","かみ","kami","paper","paper","things"], ["傘","かさ","kasa","umbrella","umbrella","things"],
  ["箱","はこ","hako","box","package","things"], ["部屋","へや","heya","room","bed","things"],
  ["円","えん","en","yen","yen","things"], ["日本","にほん","nihon","Japan","japan","things"],
  ["橋","はし","hashi","bridge","bridge","things"], ["糸","いと","ito","thread","thread","things"],
  ["門","もん","mon","gate","door","things"], ["湯","ゆ","yu","hot water","onsen","things"],
  // colors & positions
  ["赤","あか","aka","red","redcircle","colors"], ["青","あお","ao","blue","bluecircle","colors"],
  ["白","しろ","shiro","white","whitecircle","colors"], ["黒","くろ","kuro","black","blackcircle","colors"],
  ["色","いろ","iro","color","palette","colors"],
  ["上","うえ","ue","up, above","up","colors"], ["下","した","shita","down, below","down","colors"],
  ["中","なか","naka","inside, middle","target","colors"], ["外","そと","soto","outside","door","colors"],
].map(([k,r,ro,en,e,t],i)=>({id:i,k,r,ro,en,e,t}));

// dedupe by kanji+reading (魚 appears in two themes; keep first for collection)
const WORD_KEYS = new Set();
const UNIQUE_WORDS = WORDS.filter(w=>{const key=w.k+w.r; if(WORD_KEYS.has(key)) return false; WORD_KEYS.add(key); return true;});

// Look-alike kanji decoys for the Sushi Belt and Sign puzzles
const LOOKALIKE_KANJI = {
  "牛":["午","生"],"土":["士","工"],"木":["本","休","未"],"本":["木","体"],"日":["目","白","曰"],"目":["日","自","貝"],
  "白":["百","日"],"犬":["大","太"],"人":["入","八"],"石":["右","岩"],"手":["毛","千"],"鳥":["島","烏"],
  "千":["干","十"],"天":["夫","大"],"王":["玉","主"],"田":["由","甲"],"口":["日","回"],"子":["字","了"],
  "川":["州","三"],"山":["出","止"],"火":["水","大"],"水":["氷","永","火"],"月":["用","円"],"上":["土","止"],
  "下":["不","卞"],"中":["申","虫"],"虫":["中","蛍"],"花":["化","草"],"草":["早","花"],"雨":["両","雪"],
  "雪":["雷","電"],"猫":["描","苗"],"肉":["内","内"],"貝":["見","目"],"足":["是","走"],"耳":["取","目"],
  "門":["問","間"],"車":["東","軍"],"赤":["亦","変"],"青":["晴","清"],"空":["究","穴"],"星":["昼","旦"],
  "茶":["荼","答"],"米":["来","糸"],"糸":["系","米"],"家":["字","安"],"店":["占","広"],"町":["田","村"],
  "道":["首","通"],"駅":["馬","訳"],"船":["般","舟"],"紙":["低","氏"],"傘":["全","金"],"箱":["相","葙"],
  "円":["内","丹"],"橋":["矯","僑"],"竹":["笑","个"],"夏":["夕","憂"],"秋":["和","科"],"冬":["各","終"],"春":["奏","泰"],
  "森":["林","木"],"庭":["廷","度"],"顔":["頭","彦"],"声":["売","吉"],"愛":["受","変"],"馬":["鳥","駅"],"猿":["遠","園"],
  "亀":["竜","電"],"兎":["免","晩"],"豚":["家","逐"],"塩":["監","温"],"卵":["印","即"],"酒":["洒","西"],"湯":["場","陽"],
  "黒":["里","墨"],"色":["巴","絶"],"外":["夕","卜"],"鼻":["自","畠"],"兄":["見","兌"],"姉":["妹","柿"],"魚":["角","漁"],
  "部屋":["都屋","部室"],"日本":["日木","目本"],"牛肉":["午肉","牛内"],"弁当":["弁雪","台当"],"寿司":["寿同","春司"],"団子":["田子","団字"],
};
// Look-alike kana
const LOOKALIKE_KANA = {
  "ぬ":"め","め":"ぬ","ね":"れ","れ":"わ","わ":"ね","は":"ほ","ほ":"は","さ":"ち","ち":"さ","る":"ろ","ろ":"る",
  "い":"り","り":"い","こ":"に","に":"こ","あ":"お","お":"あ","き":"さ","く":"へ","へ":"く","し":"つ","つ":"し",
  "た":"な","な":"た","う":"つ","ま":"も","も":"ま","ゆ":"よ","よ":"ゆ","け":"は","そ":"て","て":"そ","と":"こ",
  "か":"や","や":"か","す":"む","む":"す","ふ":"ら","ら":"ふ","み":"よ","の":"め","ひ":"へ","せ":"き","え":"ん","ん":"え",
};

// Missing Half: kanji built from two parts. layout "lr" (left|right) or "tb" (top/bottom)
const PARTS = [
  {k:"林",a:"木",b:"木",l:"lr",r:"はやし",ro:"hayashi",en:"grove",e:"tree"},
  {k:"森",a:"木",b:"林",l:"tb",r:"もり",ro:"mori",en:"forest",e:"evergreen"},
  {k:"明",a:"日",b:"月",l:"lr",r:"あかるい",ro:"akarui",en:"bright",e:"sun"},
  {k:"休",a:"亻",b:"木",l:"lr",r:"やすむ",ro:"yasumu",en:"rest",e:"tree"},
  {k:"体",a:"亻",b:"本",l:"lr",r:"からだ",ro:"karada",en:"body",e:"person"},
  {k:"好",a:"女",b:"子",l:"lr",r:"すき",ro:"suki",en:"like",e:"heart"},
  {k:"男",a:"田",b:"力",l:"tb",r:"おとこ",ro:"otoko",en:"man",e:"boy"},
  {k:"炎",a:"火",b:"火",l:"tb",r:"ほのお",ro:"honoo",en:"flame",e:"fire"},
  {k:"岩",a:"山",b:"石",l:"tb",r:"いわ",ro:"iwa",en:"boulder",e:"rock"},
  {k:"畑",a:"火",b:"田",l:"lr",r:"はたけ",ro:"hatake",en:"crop field",e:"carrot"},
  {k:"鳴",a:"口",b:"鳥",l:"lr",r:"なく",ro:"naku",en:"chirp",e:"bird"},
  {k:"字",a:"宀",b:"子",l:"tb",r:"じ",ro:"ji",en:"letter, character",e:"paper"},
  {k:"安",a:"宀",b:"女",l:"tb",r:"やすい",ro:"yasui",en:"cheap, calm",e:"coin"},
  {k:"間",a:"門",b:"日",l:"out",r:"あいだ",ro:"aida",en:"between",e:"door"},
  {k:"聞",a:"門",b:"耳",l:"out",r:"きく",ro:"kiku",en:"hear",e:"ear"},
  {k:"問",a:"門",b:"口",l:"out",r:"とう",ro:"tou",en:"ask",e:"question"},
  {k:"早",a:"日",b:"十",l:"tb",r:"はやい",ro:"hayai",en:"early",e:"sun"},
  {k:"古",a:"十",b:"口",l:"tb",r:"ふるい",ro:"furui",en:"old",e:"candle"},
  {k:"晴",a:"日",b:"青",l:"lr",r:"はれ",ro:"hare",en:"clear weather",e:"sun"},
  {k:"村",a:"木",b:"寸",l:"lr",r:"むら",ro:"mura",en:"village",e:"houses"},
  {k:"思",a:"田",b:"心",l:"tb",r:"おもう",ro:"omou",en:"think",e:"speaking"},
  {k:"星",a:"日",b:"生",l:"tb",r:"ほし",ro:"hoshi",en:"star",e:"star"},
  {k:"加",a:"力",b:"口",l:"lr",r:"くわえる",ro:"kuwaeru",en:"add",e:"sparkles"},
  {k:"草",a:"艹",b:"早",l:"tb",r:"くさ",ro:"kusa",en:"grass",e:"herb"},
  {k:"花",a:"艹",b:"化",l:"tb",r:"はな",ro:"hana",en:"flower",e:"blossom"},
  {k:"空",a:"穴",b:"工",l:"tb",r:"そら",ro:"sora",en:"sky",e:"sky"},
  {k:"妹",a:"女",b:"未",l:"lr",r:"いもうと",ro:"imouto",en:"little sister",e:"girl"},
  {k:"姉",a:"女",b:"市",l:"lr",r:"あね",ro:"ane",en:"older sister",e:"girl"},
  {k:"町",a:"田",b:"丁",l:"lr",r:"まち",ro:"machi",en:"town",e:"houses"},
  {k:"音",a:"立",b:"日",l:"tb",r:"おと",ro:"oto",en:"sound",e:"speaker"},
  {k:"昔",a:"龷",b:"日",l:"tb",r:"むかし",ro:"mukashi",en:"long ago",e:"hourglass"},
  {k:"利",a:"禾",b:"刂",l:"lr",r:"り",ro:"ri",en:"profit",e:"coin"},
  {k:"秋",a:"禾",b:"火",l:"lr",r:"あき",ro:"aki",en:"autumn",e:"maple"},
  {k:"位",a:"亻",b:"立",l:"lr",r:"くらい",ro:"kurai",en:"rank",e:"trophy"},
  {k:"信",a:"亻",b:"言",l:"lr",r:"しん",ro:"shin",en:"believe",e:"heartribbon"},
  {k:"話",a:"言",b:"舌",l:"lr",r:"はなす",ro:"hanasu",en:"talk",e:"speaking"},
  {k:"計",a:"言",b:"十",l:"lr",r:"はかる",ro:"hakaru",en:"measure",e:"abacus"},
  {k:"時",a:"日",b:"寺",l:"lr",r:"とき",ro:"toki",en:"time",e:"hourglass"},
  {k:"汁",a:"氵",b:"十",l:"lr",r:"しる",ro:"shiru",en:"soup",e:"teacup"},
  {k:"池",a:"氵",b:"也",l:"lr",r:"いけ",ro:"ike",en:"pond",e:"droplet"},
];
const PART_DECOYS = ["木","日","月","口","田","火","山","石","女","子","亻","宀","門","十","力","心","艹","言","氵","禾","立","寸","生","青","耳","鳥","工","穴","本","土","人","大","目","金","糸"];

// Garden Logic items
const LOGIC_ITEMS = [
  {k:"花",r:"はな",ro:"hana",en:"flower",e:"blossom"},
  {k:"木",r:"き",ro:"ki",en:"tree",e:"tree"},
  {k:"石",r:"いし",ro:"ishi",en:"stone",e:"rock"},
  {k:"犬",r:"いぬ",ro:"inu",en:"dog",e:"dog"},
  {k:"猫",r:"ねこ",ro:"neko",en:"cat",e:"cat"},
  {k:"鳥",r:"とり",ro:"tori",en:"bird",e:"bird"},
  {k:"虫",r:"むし",ro:"mushi",en:"bug",e:"ladybug"},
  {k:"竹",r:"たけ",ro:"take",en:"bamboo",e:"bamboo"},
  {k:"亀",r:"かめ",ro:"kame",en:"turtle",e:"turtle"},
  {k:"兎",r:"うさぎ",ro:"usagi",en:"rabbit",e:"rabbit"},
];

// Konbini items for price puzzles
const KONBINI = [
  {k:"お茶",r:"おちゃ",ro:"ocha",en:"tea",e:"teacup"},
  {k:"弁当",r:"べんとう",ro:"bentou",en:"boxed lunch",e:"bento"},
  {k:"団子",r:"だんご",ro:"dango",en:"dango",e:"dango"},
  {k:"卵",r:"たまご",ro:"tamago",en:"egg",e:"egg"},
  {k:"傘",r:"かさ",ro:"kasa",en:"umbrella",e:"umbrella"},
  {k:"おにぎり",r:"おにぎり",ro:"onigiri",en:"rice ball",e:"riceball"},
  {k:"肉まん",r:"にくまん",ro:"nikuman",en:"meat bun",e:"meat"},
  {k:"酒",r:"さけ",ro:"sake",en:"sake",e:"sake"},
  {k:"本",r:"ほん",ro:"hon",en:"book",e:"books"},
  {k:"花",r:"はな",ro:"hana",en:"flowers",e:"tulip"},
];

// Buds who sit at the sushi counter
const BUDS = [
  {id:"mame", name:"Mame", jp:"まめ", theme:"nature", likes:"nature", sprites:["seedling","tulip","sakura"]},
  {id:"piyo", name:"Piyo", jp:"ぴよ", theme:"animals", likes:"animals", sprites:["hatching","babychick","bird"]},
  {id:"kinoko", name:"Kinoko", jp:"きのこ", theme:"food", likes:"food & things", sprites:["mushroom","mushroom","mushroom"]},
];

// Stamp book pages (each completed page earns a trophy)
const STAMP_PAGES = [
  { id: "nature", name: "Nature & colors", jp: "自然", themes: ["nature", "colors"], trophy: "Nature Walker", icon: "maple" },
  { id: "animals", name: "Animals", jp: "動物", themes: ["animals"], trophy: "Zookeeper", icon: "monkey" },
  { id: "people", name: "People & body", jp: "人", themes: ["people"], trophy: "People Person", icon: "smile" },
  { id: "food", name: "Food", jp: "食べ物", themes: ["food"], trophy: "Foodie", icon: "dango" },
  { id: "things", name: "Places & things", jp: "町", themes: ["things"], trophy: "Town Explorer", icon: "houses" },
];

// Games with 10-level ladders and rally stamp cards
const RALLY_GAMES = [
  { id: "petal", name: "Petal Guess", icon: "tulip" },
  { id: "plot", name: "Garden Plot", icon: "carrot" },
  { id: "logic", name: "Garden Logic", icon: "rabbit" },
  { id: "half", name: "Missing Half", icon: "puzzle" },
  { id: "line", name: "Number Line", icon: "abacus" },
  { id: "sushi", name: "Sushi Belt", icon: "sushi" },
];
const LEVELS_N = 10;
