export const CONF_ENV = "production";

export const conf = {
  testing: {
    // General Contants
    MS_IN_A_DAY: 864_00_000,

    HALF_MUL: 1000000000000000000,

    FEE_ADDRESS: "",

    HOP_API_KEY: "hopapiJrsprQopziLlhXKFPGV98ECGjBTcsxx5",

    HOP_MAX_SLIPPAGE_BPS: 100,

    DEFAULT_HOP_SLIPPAGE: 1,

    DEFAULT_CETUS_SLIPPAGE: 1,

    DEFAULT_SWAP_SLIPPAGE: 1,

    SUI_NETWORK: "mainnet",

    CLOCK_PACKAGE_ID:
      "0x0000000000000000000000000000000000000000000000000000000000000006",

    PRICE_ORACLE:
      "0x1568865ed9a0b5ec414220e8f79b3d04c77acc82358f6e5ae4635687392ffbef",

    ALPHA_XUSDC_COIN_TYPE: "",

    ALPHA_XUSDT_COIN_TYPE: "",

    ALPHAFI_EMERGENCY_CAP:
      "0xff4ab9e4c7e9e4011ad87285e090eea7397b9f22cf620dbf8a276b48b6be54e3",

    // constants for Alpha Protocol

    ALPHA_FIRST_PACKAGE_ID:
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e",

    ALPHA_LATEST_PACKAGE_ID:
      "0xc937029af4de1c242b5f41f5db4e423acf434f61635858aacc38d3c4af875ac6",

    ALPHA_MODULE_PACKAGE_IDS: [
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e",
      "0xd125a4fd587ae87cd0290df876601b352842aaeeb4cf813a6fdc7d62f2b5b699",
      "0xbcdbe865d8b2e84bbc217c12edb9cbad14a71ff8a0a1d849263c6b4b377780f1",
    ],
    ALPHA_PACKAGE_IDS: [],

    ALPHA_2_FIRST_PACKAGE_ID:
      "0x2bc50698b26faad5988f58313e2fc347f85b6b6554cde120504c58f6bc057c30",
    ALPHA_2_LATEST_PACKAGE_ID:
      "0x4ce3c7593590b3c1d64a9305ca8ba6a3b872176264d05317e16a5109d0205c40",

    ALPHA_2_MODULE_PACKAGE_IDS: [
      "0x2bc50698b26faad5988f58313e2fc347f85b6b6554cde120504c58f6bc057c30",
      "0x08cf597e591682a0f9ca192ca2cb919e72921e6e77aa7337186c3cccd926d925", //error module
      "0x7bd4f5cec112e6993fa5eb996443fc5690e1db3a46a86b1b4bb91d9f266e5b90",
      "0x25634acc87b85796196f3f23d4dfc250aa8f8b2373c5a1e1613a8c228d0c95bf", // sui vsui loop
      "0x76ce88c8b1d89257285da22ea7ef00391e309e261a72550fd729898ae7e97f45", // sui vsui loooping with kriya
      "0x979380db3fcc9405626f5cf1939e819dc5d9f877997be2cb2aa4b031b1494ae5", // sui vsui loop final
      "0xebdac8c4bcc01e52f3f2870088f64fdb9bfd1c2cfafb67cba4503d675b3fb656", // usdt usdc loop
      "0x318c8a6c3c2b51287c5b75f301e3fda71ddee4a9cea431801673a0d171097b7f", // usdt native usdc loop
      "0x022257d081742f275b6f16c697b11d7a9059a8d56d2067268bde3d643de5df7c", // usdt usdc native loop (hiopefuilly final)
      "0x43f8f62d5023249271921ec19208e11b9ecef00d2fb2134d0fcef0b3fded62bb", //usdc usdt looping
    ],
    ALPHA_2_PACKAGE_IDS: [],

    ALPHA_3_FIRST_PACKAGE_ID:
      "0x5d7e334882bd265ef509b842eb7319d38326f832a04ea179f1432617c96aeb06",
    ALPHA_3_LATEST_PACKAGE_ID:
      "0xfec0d57d6f52bee80174223b889992f8ee689523a257d1b6406331ef15c6efc5",

    ALPHA_3_MODULE_PACKAGE_IDS: [
      "0x5d7e334882bd265ef509b842eb7319d38326f832a04ea179f1432617c96aeb06",
      "0xb84dd393b055dd0ab669557c53b0296a2e707eb650f7a5600db6fe01cfbe1c9e",
    ],
    ALPHA_3_PACKAGE_IDS: [],
    ALPHA_4_FIRST_PACKAGE_ID:
      "0xeea4b39278f417d8320a581b34af2f312c505f89d94a9e74a16c0964cc5ba0d1",
    ALPHA_4_LATEST_PACKAGE_ID:
      "0xfc1054060e8dfcede53edc37893e170575b2bc5926347602590b1a6ca380f45f",

    ALPHA_4_MODULE_PACKAGE_IDS: [
      "0xeea4b39278f417d8320a581b34af2f312c505f89d94a9e74a16c0964cc5ba0d1",
    ],
    ALPHA_4_PACKAGE_IDS: [],
    ALPHA_5_FIRST_PACKAGE_ID:
      "0x5441ed00fa7b209ad951d31c6e3d4d48ad8666e6d2a5155e4f5e99dd74177288",
    ALPHA_5_LATEST_PACKAGE_ID:
      "0x7d43ebc5ab6c2b6a9d239a3943317a36ce2ae845065bcf172c9b66143f614ebb",

    ALPHA_5_MODULE_PACKAGE_IDS: [
      "0x5441ed00fa7b209ad951d31c6e3d4d48ad8666e6d2a5155e4f5e99dd74177288",
    ],
    ALPHA_5_PACKAGE_IDS: [],
    ALPHA_DISTRIBUTOR:
      "0xc83a5765802d20d19b66b1be808131a58b10f480a5bbebb8f9ea04c6e5baade2",

    VERSION:
      "0xd835f0c985eadf2b41941e70fa4090af4e206ea39b7d7477174c54fa6686386a",

    ALPHA_2_VERSION:
      "0xb5e99649189855b60efbc7abbad75985215cee0bd6fb451316e02036adccbac7", // new package for looping strategy

    ALPHA_3_VERSION:
      "0x555bb106205b7eda407029ddf954e1c05bdfc65d334955d128f4ca3eba9df009",
    ALPHA_4_VERSION:
      "0x0799d7bc693ea0b31dda2ee5f919cdaa080822bcf9474287b8519d9bd388698f",

    ALPHA_5_VERSION:
      "0xd4a8439bd138b214cd0d87e4fda782466059901f982071f6921d848b6d443e45",

    VOLO_NATIVE_POOL:
      "0x7fa2faa111b8c65bea48a23049bfd81ca8f971a262d981dcd9a17c3825cb5baf",

    VOLO_METADATA:
      "0x680cd26af32b2bde8d3361e804c53ec1d1cfe24c7f039eb7f549e8dfde389a60",

    SUI_SYSTEM_STATE:
      "0x0000000000000000000000000000000000000000000000000000000000000005",

    ALPHA_NAVI_BORROW_FACTOR: 0.95,

    ALPHA_TOKEN_REWARD_SHARE: 0.45,

    ALPHA_PROTOCOL_INFO_OBJECT_ID: "", // TODO

    // Coin Types
    // BETA_COIN_TYPE:
    //   "0x3813ca8aa2849b6369106ea749b0bdc5d72a671a267bf55a4be68c6c86fb911f::beta::BETA",

    ALPHA_COIN_TYPE:
      "0x3813ca8aa2849b6369106ea749b0bdc5d72a671a267bf55a4be68c6c86fb911f::beta::BETA",

    SUI_COIN_TYPE: "0x2::sui::SUI",

    USDT_COIN_TYPE:
      "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",

    USDC_COIN_TYPE:
      "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",

    WUSDC_COIN_TYPE:
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",

    VSUI_COIN_TYPE:
      "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT",

    CETUS_COIN_TYPE:
      "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",

    SCALLOP_COIN_TYPE:
      "0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA",

    NAVX_COIN_TYPE:
      "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX",

    USDY_COIN_TYPE:
      "0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY",

    HASUI_COIN_TYPE:
      "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI",

    ALPHA_XSUI_COIN_TYPE:
      "0x07cb3a546202773a06b0b18c9af9c76c8679a2a0fe8d653cecb7dfbf7933e019::xsui::XSUI",

    WBTC_COIN_TYPE:
      "0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN",

    WETH_COIN_TYPE:
      "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN",

    BUCK_COIN_TYPE:
      "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK ",

    WSOL_COIN_TYPE:
      "0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN",
    FUD_COIN_TYPE:
      "0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1::fud::FUD",
    BLUB_COIN_TYPE:
      "0xfa7ac3951fdca92c5200d468d31a365eb03b2be9936fde615e69f0c1274ad3a0::BLUB::BLUB",

    DEEP_COIN_TYPE:
      "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP",
    ETH_COIN_TYPE:
      "0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29::eth::ETH",
    AUSD_COIN_TYPE:
      "0x2053d08c1e2bd02791056171aab0fd12bd7cd7efad2ab8f6b9c8902f14df2ff2::ausd::AUSD",
    NS_COIN_TYPE:
      "0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS",

    // Alpha POOL Id's

    ALPHA_POOL:
      "0x0c59f8e743a0ab97b82cbd6b83e8e8791f9b408735d32d8fe6cd4a268732ee61",

    WUSDC_USDT_POOL:
      "0x44dc3da97b8e387652c4035a50ecb2c8378e5267943324c4147b3be290d3bd12",

    ALPHA_SUI_POOL: "",

    HASUI_SUI_POOL:
      "0xab1ac9c8c9cedf59671f286a208861b717b91b9553176b65d63ba9cdcfd335ec",

    USDY_WUSDC_POOL:
      "0xff2b3f3a26281a8cdffa8ce028315f603262e2bb4b2f5e2689256215e5ac75cf",
    WUSDC_WBTC_POOL:
      "0x1ef0da85103101ed4e9523115d46d29e57ecf0909dee574af5b421ba0483e38e",
    ALPHA_USDT_POOL: "",
    WUSDC_SUI_POOL: "",
    WETH_WUSDC_POOL: "",
    NAVX_SUI_POOL:
      "0x9dc8aefce176a265e14d71f64e960ace3d5da2ded47141cf652d8172551463b1",
    BUCK_WUSDC_POOL: "",

    CETUS_SUI_POOL:
      "0x65d9d0d6f9347317a5ac35a21100ce57c9e88efe7bd35f860edfa42c9dea155d",

    ALPHA_WUSDC_POOL: "", //0xc04fb3f2edd6e0a24c7078246428ed9fedcc79d7ed0fc795b5ed2249e8ac7d0c
    WSOL_WUSDC_POOL: "",
    FUD_SUI_POOL: "",
    BLUB_SUI_POOL:
      "0x8eea98c9710712acc429445130849de86657e363d0592d7bd2fd6b27c32aa64f",
    SCA_SUI_POOL: "",

    USDC_SUI_POOL:
      "0xd66b7d879062d19b7ace8fe74ef5dc9aa159be1d2ae41cc6489a4527653767f9",

    USDC_USDT_POOL:
      "0x0de2c700dbfce0e60d3decd4b79a9647ca68ce7f37e6004af97e0471c6a8dbc0",

    ALPHA_USDC_POOL: "",
    USDC_WUSDC_POOL: "",
    USDC_ETH_POOL: "",
    DEEP_SUI_POOL: "",
    BUCK_SUI_POOL: "",

    // Alphafi-Navi Pools

    ALPHAFI_NAVI_SUI_POOL:
      "0xd754696e2a7bb50e1ebdf2b1db45e525a99aab1c7640ca8126f2264bc0a4f753",
    ALPHAFI_NAVI_VSUI_POOL:
      "0x43c16f8c8c6182c8712c83e31df22dcfaf3f2c644584e2a6cc3f7244465fa04e",
    ALPHAFI_NAVI_WETH_POOL:
      "0x990d3af75f1ebcc9a05c34eb6b115eaeb61e9f72eb9955fcc83dbf1e9c91bff7",
    ALPHAFI_NAVI_USDT_POOL:
      "0xf1a10734b9acc82ab5ea8d7b35f1ffa053a43b0ca05603dc1f515c5d5e707926",
    ALPHAFI_NAVI_WUSDC_POOL: "",
    ALPHAFI_NAVI_USDC_POOL:
      "0xd31cbabca7e7e10c1c41e3e6bb22e98be18007e40df1e595b0c9b563ae84f79e",
    ALPHAFI_NAVI_HASUI_POOL: "",
    ALPHAFI_NAVI_LOOP_SUI_VSUI_POOL:
      "0x17f1c76036f5773d7e2850b93d2ad191ac3a7f20454d08fa609b37e1537c647f",
    ALPHAFI_NAVI_LOOP_USDC_USDT_POOL:
      "0x7b6a86b2b1b5fe9ec966e42c512486526a784de35e2bef9b3a6e0836349823f4",
    ALPHAFI_NAVI_USDY_POOL: "",
    ALPHAFI_NAVI_AUSD_POOL:
      "0x2acc7fbb82bcfc956aa4a85f7a9f450011023411fea4ecc5dad72ac05ad3c2f7",
    ALPHAFI_NAVI_ETH_POOL:
      "0x1a5b8f060d00d7c5ecfdd48b180a19c678d1193539e572cb7ac64221023ecd07",
    ALPHAFI_NAVI_LOOP_HASUI_SUI_POOL:
      "0x497a82f06b74cecfdaae08642ca3a230ca646397b42fcc75854ab81b66aa9393",
    ALPHAFI_NAVI_LOOP_USDT_USDC_POOL:
      "0x846400b65957b30916664174f66794755cccf4bc5b3eb5510fd83177c5580e92",
    ALPHAFI_NAVI_NS_POOL:
      "0xa5c44e8596007b806f933e673ffe18c79a1c415b2b39cd4b022eb13985c164c2",

    //alphafi bucket pools

    BUCKET_BUCK_POOL:
      "0x2c8068ff50d96b2a274e48ff9e335160212b647e6aaede11048669e5929fc97f",

    // alphafi bluefin pools

    ALPHAFI_BLUEFIN_SUI_USDC_POOL:
      "0xf9c7d097edf3a9b9848469995cf8c960e073db254b9ed2f050fc3ea63dc9762a",

    ALPHAFI_BLUEFIN_USDT_USDC_POOL:
      "0x141810da3657be7bdaa4d9799e6fdfe7f2bcd5e3cec7993faddbde95a14ebe24",
    ALPHAFI_BLUEFIN_SUI_BUCK_POOL:
      "0x58c4a8c5d18c61156e1a5a82811fbf71963a4de3f5d52292504646611a308888",

    ALPHAFI_BLUEFIN_AUSD_USDC_POOL:
      "0x8ed765497eeedf7960af787c0c419cb2c01c471ab47682a0619e8588c06a9aa6",

    // CETUS Pool Id's

    WUSDC_SUI_CETUS_POOL_ID:
      "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630",

    USDC_SUI_CETUS_POOL_ID:
      "0xb8d7d9e66a60c239e7a60110efcf8de6c705580ed924d0dde141f4a0e2c90105",

    CETUS_SUI_CETUS_POOL_ID:
      "0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded",

    USDC_USDT_CETUS_POOL_ID:
      "0x6bd72983b0b5a77774af8c77567bb593b418ae3cd750a5926814fcd236409aaa",

    USDT_WUSDC_CETUS_POOL_ID:
      "0xc8d7a1503dc2f9f5b05449a87d8733593e2f0f3e7bffd90541252782e4d2ca20",

    ALPHA_SUI_CETUS_POOL_ID:
      "0x79882488b71c90d0be2fe8116972b46f62a2a92cbbca23e67e8788338c85b204",

    USDY_WUSDC_CETUS_POOL_ID:
      "0x0e809689d04d87f4bd4e660cd1b84bf5448c5a7997e3d22fc480e7e5e0b3f58d",

    HASUI_SUI_CETUS_POOL_ID:
      "0x871d8a227114f375170f149f7e9d45be822dd003eba225e83c05ac80828596bc",

    WUSDC_WBTC_CETUS_POOL_ID:
      "0xaa57c66ba6ee8f2219376659f727f2b13d49ead66435aa99f57bb008a64a8042",

    WETH_WUSDC_CETUS_POOL_ID:
      "0x5b0b24c27ccf6d0e98f3a8704d2e577de83fa574d3a9060eb8945eeb82b3e2df",
    VSUI_SUI_CETUS_POOL_ID:
      "0x6c545e78638c8c1db7a48b282bb8ca79da107993fcb185f75cedc1f5adb2f535",
    NAVX_SUI_CETUS_POOL_ID:
      "0x0254747f5ca059a1972cd7f6016485d51392a3fde608107b93bbaebea550f703",

    WUSDC_CETUS_CETUS_POOL_ID:
      "0x238f7e4648e62751de29c982cbf639b4225547c31db7bd866982d7d56fc2c7a8",

    BUCK_WUSDC_CETUS_POOL_ID:
      "0x81fe26939ed676dd766358a60445341a06cea407ca6f3671ef30f162c84126d5",

    ALPHA_WUSDC_CETUS_POOL_ID:
      "0x0cbe3e6bbac59a93e4d358279dff004c98b2b8da084729fabb9831b1c9f71db6",
    WSOL_WUSDC_CETUS_POOL_ID:
      "0x9ddb0d269d1049caf7c872846cc6d9152618d1d3ce994fae84c1c051ee23b179",
    FUD_SUI_CETUS_POOL_ID:
      "0xfc6a11998f1acf1dd55acb58acd7716564049cfd5fd95e754b0b4fe9444f4c9d",
    BLUB_SUI_CETUS_POOL_ID:
      "0x40a372f9ee1989d76ceb8e50941b04468f8551d091fb8a5d7211522e42e60aaf",
    SCA_SUI_CETUS_POOL_ID:
      "0xaa72bd551b25715b8f9d72f226fa02526bdf2e085a86faec7184230c5209bb6e",

    ALPHA_USDC_CETUS_POOL_ID:
      "0x29e218b46e35b4cf8eedc7478b8795d2a9bcce9c61e11101b3a039ec93305126",

    USDC_WUSDC_CETUS_POOL_ID:
      "0x1efc96c99c9d91ac0f54f0ca78d2d9a6ba11377d29354c0a192c86f0495ddec7",

    DEEP_SUI_CETUS_POOL_ID:
      "0xe01243f37f712ef87e556afb9b1d03d0fae13f96d324ec912daffc339dfdcbd2",
    USDC_ETH_CETUS_POOL_ID:
      "0x9e59de50d9e5979fc03ac5bcacdb581c823dbd27d63a036131e17b391f2fac88",
    BUCK_SUI_CETUS_POOL_ID:
      "0x59cf0d333464ad29443d92bfd2ddfd1f794c5830141a5ee4a815d1ef3395bf6c",
    USDC_BUCK_CETUS_POOL_ID:
      "0x4c50ba9d1e60d229800293a4222851c9c3f797aa5ba8a8d32cc67ec7e79fec60",
    USDC_AUSD_CETUS_POOL_ID:
      "0x0fea99ed9c65068638963a81587c3b8cafb71dc38c545319f008f7e9feb2b5f8",
    WETH_SUI_CETUS_POOL_ID:
      "0xc51752c87e7363dec32bb429cabcb7774aaabb45fa5d2c17edfbb59bd6d1deb0",

    WBTC_SUI_CETUS_POOL_ID:
      "0xe0c526aa27d1729931d0051a318d795ad0299998898e4287d9da1bf095b49658",

    NS_SUI_CETUS_POOL_ID:
      "0x763f63cbada3a932c46972c6c6dcf1abd8a9a73331908a1d7ef24c2232d85520",

    //Cetus Info Id's

    CETUS_REWARDER_GLOBAL_VAULT_ID:
      "0xce7bceef26d3ad1f6d9b6f13a953f053e6ed3ca77907516481ce99ae8e588f2b",

    CETUS_GLOBAL_CONFIG_ID:
      "0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f",

    // Cetus Investor Id's

    ALPHA_CETUS_INVESTOR: "",

    USDT_WUSDC_CETUS_INVESTOR:
      "0x6eaf967d65d7586f206ca5522a728a0ec1b80992f8f1a34e09a935138f627dfa",

    ALPHA_SUI_CETUS_INVESTOR:
      "0xd92fb59b0173c5429658c73534fb567ae51863f1a9f6c63b1fb5b8c07dec5a9f",

    HASUI_SUI_CETUS_INVESTOR:
      "0xf649267641724f85734543b2f60aeb157e8a046ac773fc97c22d2638124c9efc",

    USDY_WUSDC_CETUS_INVESTOR:
      "0x522d71aa19d30a8c154a34e2e38020c1be6ea6f69887057f1eded5580eeb768d",

    WUSDC_WBTC_CETUS_INVESTOR:
      "0x298b8f6fc49cefa46a8d45f1c5e86ab58c79e1bab968cf0b93daf074ad3269c6",
    ALPHA_USDT_CETUS_INVESTOR: "",
    WUSDC_SUI_CETUS_INVESTOR: "",

    WETH_WUSDC_CETUS_INVESTOR: "",
    NAVX_SUI_CETUS_INVESTOR:
      "0x7dd0aa1117683dae31221704237749944d983639452600b6e486a8d3c14c0e6a",

    BUCK_WUSDC_CETUS_INVESTOR: "",

    CETUS_SUI_CETUS_INVESTOR:
      "0x5f7585ef6fff3e9d6c0d879374ad6da6eacdabb223af057ba204b7dba365f93c",

    ALPHA_WUSDC_CETUS_INVESTOR:
      "0x7a7b701fbd5a622d7b331159e8cf42543e5dcae104592aedd39de8acf9a112d3",
    WSOL_WUSDC_CETUS_INVESTOR: "",
    FUD_SUI_CETUS_INVESTOR: "",
    BLUB_SUI_CETUS_INVESTOR:
      "0x3cd49468acd7cf994e4e74df446b63e523e9290ccbca6a19c423deef254ca030",
    SCA_SUI_CETUS_INVESTOR: "",

    USDC_SUI_CETUS_INVESTOR:
      "0x16e435b849c9585ce285d1b66219feda4e9e54a3ebcad5b14abd39e6e23d617b",

    USDC_USDT_CETUS_INVESTOR:
      "0x8f6d4cc83f533f8c66a9db6f9aa7495857a2f82e5d3ca2fda3c3d54d7c17dd63",

    ALPHA_USDC_CETUS_INVESTOR: "",

    USDC_WUSDC_CETUS_INVESTOR: "",

    USDC_ETH_CETUS_INVESTOR: "",

    DEEP_SUI_CETUS_INVESTOR: "",

    BUCK_SUI_CETUS_INVESTOR: "",

    // Navi Investor Ids

    NAVI_SUI_INVESTOR:
      "0x1a19c5c570ea00695abbb3cdae92caa8b4c4780bf8bf63705cd90c582740570a",

    NAVI_VSUI_INVESTOR:
      "0xa02f11c802bc0e230b72479a308b0b8da948ee00fc7e18c72222a0291cc47b30",

    NAVI_WETH_INVESTOR:
      "0xb246f0afffd1d2c13dac4af3c0f328f198f01a49a7fb326485c22a3e8371cba8",

    NAVI_USDT_INVESTOR:
      "0x77970e1f98160c4e72f57603e1525179d060a8a30baa1fe0fdae2c6b30173d5a",

    NAVI_WUSDC_INVESTOR: "",

    NAVI_HASUI_INVESTOR: "",

    NAVI_LOOP_SUI_VSUI_INVESTOR:
      "0x0c153f2e8142767d4d7e96122287307415d1dc1a06f1c7ac4142f2432679927d",

    NAVI_LOOP_USDC_USDT_INVESTOR:
      "0xcf076143f1b24edee18cb82047e0e2925802a8816065e74192d3b9d75b8b50d2",

    NAVI_USDC_INVESTOR:
      "0xe436cf3b9b141ce6816503602b4de8b0dc2842a812e2cacf61482557fcca6375",

    NAVI_USDY_INVESTOR: "",
    NAVI_AUSD_INVESTOR:
      "0x8893cc0eff07fb74b7804d3c1371c15fc57700611181a0494657533091ceff45",
    NAVI_ETH_INVESTOR:
      "0x75c3fc4ff0b5af630c3495a7347eb0f044fc0814fc3a0ba7aefc92ce3df85a32",

    NAVI_LOOP_HASUI_SUI_INVESTOR:
      "0xf38600f5f8ca91f035657e0b11da0209a44a3446db083958a7ae2bc175b25a11",
    NAVI_LOOP_USDT_USDC_INVESTOR:
      "0x91f2d13293656181269a53598415e1aca7b1a3d4039e9e03fd46b90481aa9017",

    NAVI_NS_INVESTOR:
      "0xb3a78229f8b961ee901bc0954d16ff72d4babd4ffc240d9b7ef421e59a60b2b0",
    //ALPHAFI BUCKET INVESTORS
    BUCKET_BUCK_INVESTOR:
      "0x296a9c39ba3bd4a7bb3c2e00b0ed628fbe5a366fb289611e952ecada8127e3eb",

    // ALPHAFI BLUEFIN INVESTORS
    ALPHAFI_BLUEFIN_SUI_USDC_INVESTOR:
      "0xad931bd8dd5339beffa9292b35597659739f6f0a91ceb3d02afacaeb45cfa357",
    ALPHAFI_BLUEFIN_USDT_USDC_INVESTOR:
      "0xa46e3915cc82b0f4d7e08885e9e69b5a3488619a00ccfb70dcecace39cb49990",
    ALPHAFI_BLUEFIN_SUI_BUCK_INVESTOR:
      "0xc04ef6923ae5cf047cf853d2fa809ab56dbe712ca95f87c5f3c12dcfe66f7ecd",

    ALPHAFI_BLUEFIN_AUSD_USDC_INVESTOR:
      "0x1f9f325dfb23a3516679cd7bda58c26791b2a34c40ce5e1cd88ee6f8361a0ea6",

    // Receipt Types

    ALPHA_POOL_RECEIPT:
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e::alphapool::Receipt",

    ALPHA_SUI_POOL_RECEIPT:
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e::alphafi_cetus_sui_pool::Receipt",

    USDT_WUSDC_POOL_RECEIPT:
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e::alphafi_cetus_pool::Receipt",

    USDY_WUSDC_POOL_RECEIPT:
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e::alphafi_cetus_pool::Receipt",

    HASUI_SUI_POOL_RECEIPT:
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e::alphafi_cetus_sui_pool::Receipt",

    WUSDC_WBTC_POOL_RECEIPT:
      "0xd125a4fd587ae87cd0290df876601b352842aaeeb4cf813a6fdc7d62f2b5b699::alphafi_cetus_pool_base_a::Receipt",
    WUSDC_SUI_POOL_RECEIPT:
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e::alphafi_cetus_sui_pool::Receipt",

    WETH_WUSDC_POOL_RECEIPT:
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e::alphafi_cetus_pool::Receipt",

    BUCK_WUSDC_POOL_RECEIPT:
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e::alphafi_cetus_pool::Receipt",

    CETUS_SUI_POOL_RECEIPT:
      "0x7bd4f5cec112e6993fa5eb996443fc5690e1db3a46a86b1b4bb91d9f266e5b90::alphafi_cetus_sui_pool::Receipt",

    NAVI_SUI_POOL_RECEIPT:
      "0xbcdbe865d8b2e84bbc217c12edb9cbad14a71ff8a0a1d849263c6b4b377780f1::alphafi_navi_pool::Receipt",

    NAVI_VSUI_POOL_RECEIPT:
      "0xbcdbe865d8b2e84bbc217c12edb9cbad14a71ff8a0a1d849263c6b4b377780f1::alphafi_navi_pool::Receipt",

    NAVI_WETH_POOL_RECEIPT:
      "0xbcdbe865d8b2e84bbc217c12edb9cbad14a71ff8a0a1d849263c6b4b377780f1::alphafi_navi_pool::Receipt",

    NAVI_USDT_POOL_RECEIPT:
      "0xbcdbe865d8b2e84bbc217c12edb9cbad14a71ff8a0a1d849263c6b4b377780f1::alphafi_navi_pool::Receipt",

    NAVI_WUSDC_POOL_RECEIPT:
      "0xbcdbe865d8b2e84bbc217c12edb9cbad14a71ff8a0a1d849263c6b4b377780f1::alphafi_navi_pool::Receipt",

    NAVI_HASUI_POOL_RECEIPT:
      "0xbcdbe865d8b2e84bbc217c12edb9cbad14a71ff8a0a1d849263c6b4b377780f1::alphafi_navi_pool::Receipt",

    NAVX_SUI_POOL_RECEIPT:
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e::alphafi_cetus_sui_pool::Receipt",

    NAVI_LOOP_SUI_VSUI_RECEIPT:
      "0x979380db3fcc9405626f5cf1939e819dc5d9f877997be2cb2aa4b031b1494ae5::alphafi_navi_sui_vsui_pool::Receipt",

    ALPHA_WUSDC_POOL_RECEIPT:
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e::alphafi_cetus_pool::Receipt",
    WSOL_WUSDC_POOL_RECEIPT:
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e::alphafi_cetus_pool::Receipt",
    FUD_SUI_POOL_RECEIPT:
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e::alphafi_cetus_sui_pool::Receipt",
    BLUB_SUI_POOL_RECEIPT:
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e::alphafi_cetus_sui_pool::Receipt",
    SCA_SUI_POOL_RECEIPT:
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e::alphafi_cetus_sui_pool::Receipt",

    NAVI_LOOP_USDC_USDT_RECEIPT:
      "0x43f8f62d5023249271921ec19208e11b9ecef00d2fb2134d0fcef0b3fded62bb::alphafi_navi_native_usdc_usdt_pool::Receipt",

    NAVI_USDC_POOL_RECEIPT:
      "0xbcdbe865d8b2e84bbc217c12edb9cbad14a71ff8a0a1d849263c6b4b377780f1::alphafi_navi_pool::Receipt",

    USDC_SUI_POOL_RECEIPT:
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e::alphafi_cetus_sui_pool::Receipt",

    USDC_USDT_POOL_RECEIPT:
      "0xd125a4fd587ae87cd0290df876601b352842aaeeb4cf813a6fdc7d62f2b5b699::alphafi_cetus_pool_base_a::Receipt",

    ALPHA_USDC_POOL_RECEIPT:
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e::alphafi_cetus_pool::Receipt",
    USDC_WUSDC_POOL_RECEIPT:
      "0xd125a4fd587ae87cd0290df876601b352842aaeeb4cf813a6fdc7d62f2b5b699::alphafi_cetus_pool_base_a::Receipt",

    BUCKET_BUCK_POOL_RECEIPT:
      "0x5d7e334882bd265ef509b842eb7319d38326f832a04ea179f1432617c96aeb06::alphafi_bucket_pool_v1::Receipt",
    USDC_ETH_POOL_RECEIPT:
      "0xd125a4fd587ae87cd0290df876601b352842aaeeb4cf813a6fdc7d62f2b5b699::alphafi_cetus_pool_base_a::Receipt",
    DEEP_SUI_POOL_RECEIPT:
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e::alphafi_cetus_sui_pool::Receipt",
    BUCK_SUI_POOL_RECEIPT:
      "0xfcadd5525628c306cc87d980c18aec71daa8a51f17a5eba34e3a105eb64a8b7e::alphafi_cetus_sui_pool::Receipt",

    NAVI_USDY_POOL_RECEIPT:
      "0xbcdbe865d8b2e84bbc217c12edb9cbad14a71ff8a0a1d849263c6b4b377780f1::alphafi_navi_pool::Receipt",
    NAVI_AUSD_POOL_RECEIPT:
      "0xb84dd393b055dd0ab669557c53b0296a2e707eb650f7a5600db6fe01cfbe1c9e::alphafi_navi_pool_v2::Receipt",
    NAVI_ETH_POOL_RECEIPT:
      "0xb84dd393b055dd0ab669557c53b0296a2e707eb650f7a5600db6fe01cfbe1c9e::alphafi_navi_pool_v2::Receipt",

    NAVI_LOOP_HASUI_SUI_RECEIPT:
      "0x1380e8f665562eca122931a4552908d828ef74ff9c33d753b308f4087461a9cf::alphafi_navi_hasui_sui_pool::Receipt",

    NAVI_LOOP_USDT_USDC_RECEIPT:
      "0x5441ed00fa7b209ad951d31c6e3d4d48ad8666e6d2a5155e4f5e99dd74177288::alphafi_navi_usdt_usdc_pool::Receipt",

    ALPHAFI_BLUEFIN_SUI_USDC_RECEIPT:
      "0xeea4b39278f417d8320a581b34af2f312c505f89d94a9e74a16c0964cc5ba0d1::alphafi_bluefin_sui_first_pool::Receipt",
    ALPHAFI_BLUEFIN_USDT_USDC_RECEIPT:
      "0xeea4b39278f417d8320a581b34af2f312c505f89d94a9e74a16c0964cc5ba0d1::alphafi_bluefin_type_1_pool::Receipt",
    ALPHAFI_BLUEFIN_SUI_BUCK_RECEIPT:
      "0xeea4b39278f417d8320a581b34af2f312c505f89d94a9e74a16c0964cc5ba0d1::alphafi_bluefin_sui_first_pool::Receipt",

    ALPHAFI_BLUEFIN_AUSD_USDC_RECEIPT:
      "0xeea4b39278f417d8320a581b34af2f312c505f89d94a9e74a16c0964cc5ba0d1::alphafi_bluefin_sui_first_pool::Receipt",

    NAVI_NS_POOL_RECEIPT:
      "0xb84dd393b055dd0ab669557c53b0296a2e707eb650f7a5600db6fe01cfbe1c9e::alphafi_navi_pool_v2::Receipt",
    // Receipt Names

    ALPHA_POOL_RECEIPT_NAME: "Betafi-BETA-receipt",

    ALPHA_SUI_POOL_RECEIPT_NAME: "Betafi-ALPHA-SUI-receipt",

    USDT_WUSDC_POOL_RECEIPT_NAME: "Betafi-USDT-USDC-receipt",

    USDY_WUSDC_POOL_RECEIPT_NAME: "Betafi-USDY-USDC-receipt",

    HASUI_SUI_POOL_RECEIPT_NAME: "Betafi-HASUI-SUI-receipt",

    WUSDC_SUI_POOL_RECEIPT_NAME: "Betafi-USDC-SUI-receipt",

    WUSDC_WBTC_POOL_RECEIPT_NAME: "Betafi-USDC-WBTC-receipt",

    WETH_WUSDC_POOL_RECEIPT_NAME: "Betafi-WETH-USDC-receipt",

    NAVI_SUI_POOL_RECEIPT_NAME: "Betafi-Navi-SUI-receipt",

    NAVI_VSUI_POOL_RECEIPT_NAME: "Betafi-Navi-VSUI-receipt",

    NAVI_WETH_POOL_RECEIPT_NAME: "Betafi-Navi-WETH-receipt",

    NAVI_USDT_POOL_RECEIPT_NAME: "Betafi-Navi-USDT-receipt",

    NAVI_WUSDC_POOL_RECEIPT_NAME: "Betafi-Navi-USDC-receipt",

    NAVI_HASUI_POOL_RECEIPT_NAME: "Betafi-Navi-HASUI-receipt",

    NAVI_USDC_POOL_RECEIPT_NAME: "Betafi-Navi-USDC(native)-receipt",

    NAVX_SUI_POOL_RECEIPT_NAME: "Betafi-Navx-Sui-receipt",

    BUCK_WUSDC_POOL_RECEIPT_NAME: "Betafi-Buck-Usdc-receipt",

    CETUS_SUI_POOL_RECEIPT_NAME: "Betafi-Cetus-Sui-receipt",
    NAVI_SUI_VSUI_LOOP_RECEIPT_NAME: "Betafi-Navi-Looping-receipt",
    NAVI_USDC_USDT_LOOP_RECEIPT_NAME: "BetaFi-Navi USDC-USDT Receipt",

    ALPHA_WUSDC_POOL_RECEIPT_NAME: "Betafi-Alpha-Usdc-receipt",
    WSOL_WUSDC_POOL_RECEIPT_NAME: "Betafi-Wsol-Usdc-receipt",
    FUD_SUI_POOL_RECEIPT_NAME: "Betafi-Fud-Sui-receipt",
    BLUB_SUI_POOL_RECEIPT_NAME: "Betafi-BLUB-SUI-receipt",
    SCA_SUI_POOL_RECEIPT_NAME: "Betafi-Sca-Sui-receipt",

    USDC_SUI_POOL_RECEIPT_NAME: "BetaFi USDC(Native)-SUI Receipt",
    USDC_USDT_POOL_RECEIPT_NAME: "BetaFi USDC(Native)-USDT Receipt",
    ALPHA_USDC_POOL_RECEIPT_NAME: "BetaFi ALPHA-USDC(Native) Receipt",
    USDC_WUSDC_POOL_RECEIPT_NAME: "BetaFi USDC(Native)-WUSDC Receipt",
    USDC_ETH_POOL_RECEIPT_NAME: "AlphaFi USDC(Native)-ETH Receipt",
    DEEP_SUI_POOL_RECEIPT_NAME: "AlphaFi DEEP-SUI Receipt",
    BUCK_SUI_POOL_RECEIPT_NAME: "AlphaFi BUCK-SUI Receipt",

    BUCKET_BUCK_POOL_RECEIPT_NAME: "BetaFi-Bucket Buck Receipt",
    NAVI_USDY_POOL_RECEIPT_NAME: "BetaFi-Navi USDY Receipt",
    NAVI_AUSD_POOL_RECEIPT_NAME: "BetaFi-Navi AUSD Receipt",
    NAVI_ETH_POOL_RECEIPT_NAME: "BetaFi-Navi ETH Receipt",
    NAVI_HASUI_SUI_LOOP_RECEIPT_NAME: "BetaFi-Navi HASUI-SUI Receipt",
    ALPHAFI_BLUEFIN_SUI_USDC_RECEIPT_NAME: "BetaFi-Bluefin SUI-USDC Receipt",
    ALPHAFI_BLUEFIN_USDT_USDC_RECEIPT_NAME: "BetaFi-Bluefin USDT-USDC Receipt",
    NAVI_USDT_USDC_LOOP_RECEIPT_NAME: "BetaFi-Navi USDT-USDC Receipt",
    ALPHAFI_BLUEFIN_SUI_BUCK_RECEIPT_NAME: "AlphaFi-Bluefin SUI-BUCK Receipt",

    ALPHAFI_BLUEFIN_AUSD_USDC_RECEIPT_NAME: "AlphaFi-Bluefin AUSD-USDC Receipt",
    NAVI_NS_POOL_RECEIPT_NAME: "BetaFi-Navi NS Receipt",

    //alphafi navi account addresses
    NAVI_USDC_USDT_LOOP_ACCOUNT_ADDRESS:
      "0x999261245ded744dfc44fbe1506243ad0fcd7827bae20b80f8321c3ae494a493",
    NAVI_SUI_VSUI_LOOP_ACCOUNT_ADDRESS: "",
    NAVI_HASUI_SUI_LOOP_ACCOUNT_ADDRESS: "",
    NAVI_USDT_USDC_LOOP_ACCOUNT_ADDRESS:
      "0xc4056b0ab35b8e28caf9da260249d998931cb4d854804204a40e9afe6c019b21",
    // AutoCompoundingEvent
    ALPHA_POOL_AUTO_COMPOUNDING_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphapool::RewardEvent",

    ALPHA_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",

    USDT_WUSDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::AutoCompoundingEvent",

    USDY_WUSDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::AutoCompoundingEvent",

    HASUI_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",

    WUSDC_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",

    WUSDC_WBTC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor_base_a::AutoCompoundingEvent",

    WETH_WUSDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::AutoCompoundingEvent",

    NAVX_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",

    BUCK_WUSDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::AutoCompoundingEvent",

    CETUS_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x1a22b26f139b34c9de9718cf7e53159b2b939ec8f46f4c040776b7a3d580dd28::alphafi_cetus_sui_investor::AutoCompoundingEvent",

    NAVI_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::AutoCompoundingEvent",

    NAVI_VSUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::AutoCompoundingEvent",

    NAVI_WETH_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::AutoCompoundingEvent",

    NAVI_USDT_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::AutoCompoundingEvent",

    NAVI_WUSDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::AutoCompoundingEvent",

    NAVI_HASUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::AutoCompoundingEvent",

    NAVI_LOOP_SUI_VSUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x531989a4be74dd43b25e7bb1eeade871f4524bdf437a8eaa30b4ac2a932b5579::alphafi_navi_sui_vsui_investor::AutoCompoundingEvent",

    NAVI_LOOP_USDC_USDT_POOL_AUTO_COMPOUNDING_EVENT:
      "0xad4f82d9956085bdab812d46fb2ea4d95c35e9e936cb53d04a79d3989ef97774::alphafi_navi_native_usdc_usdt_investor::AutoCompoundingEvent",

    ALPHA_WUSDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::AutoCompoundingEvent",
    WSOL_WUSDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::AutoCompoundingEvent",
    FUD_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",
    BLUB_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",
    SCA_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",

    NAVI_USDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::AutoCompoundingEvent",

    USDC_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",

    USDC_USDT_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor_base_a::AutoCompoundingEvent",

    ALPHA_USDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::AutoCompoundingEvent",

    USDC_WUSDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor_base_a::AutoCompoundingEvent",

    USDC_ETH_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor_base_a::AutoCompoundingEvent",

    DEEP_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",

    BUCK_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",

    BUCKET_BUCK_POOL_AUTO_COMPOUNDING_EVENT:
      "0xa095412a92ff0f063cbea962f2f88b1a93cbc85c72bebf5dd7d90a8e2d6375ae::alphafi_bucket_investor_v1::AutoCompoundingEvent",
    NAVI_USDY_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::AutoCompoundingEvent",
    NAVI_AUSD_POOL_AUTO_COMPOUNDING_EVENT:
      "0x5d90d17172b9e38da9f13a982668a9e48d0b0b5f864e421b60686f60758b37bd::alphafi_navi_investor_v2::AutoCompoundingEvent",
    NAVI_ETH_POOL_AUTO_COMPOUNDING_EVENT:
      "0x5d90d17172b9e38da9f13a982668a9e48d0b0b5f864e421b60686f60758b37bd::alphafi_navi_investor_v2::AutoCompoundingEvent",
    NAVI_LOOP_HASUI_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0xb7039e74683423783f5179d6359df115af06b040bc439cbef3b307bdaceb050d::alphafi_navi_hasui_sui_investor::AutoCompoundingEvent",
    ALPHAFI_BLUEFIN_SUI_USDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_sui_first_investor::AutoCompoundingEvent",
    ALPHAFI_BLUEFIN_USDT_USDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_type_1_investor::AutoCompoundingEvent",
    NAVI_LOOP_USDT_USDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0xe516e0c12e56619c196fa0ee28d57e5e4ca532bd39df79bee9dcd1e3946119ec::alphafi_navi_usdt_usdc_investor::AutoCompoundingEvent",
    ALPHAFI_BLUEFIN_SUI_BUCK_POOL_AUTO_COMPOUNDING_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_sui_first_investor::AutoCompoundingEvent",
    ALPHAFI_BLUEFIN_AUSD_USDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_sui_first_investor::AutoCompoundingEvent",
    NAVI_NS_POOL_AUTO_COMPOUNDING_EVENT:
      "0x5d90d17172b9e38da9f13a982668a9e48d0b0b5f864e421b60686f60758b37bd::alphafi_navi_investor_v2::AutoCompoundingEvent",

    //Rebalance Event Types

    ALPHA_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",

    USDT_WUSDC_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::RebalancePoolEvent",

    USDY_WUSDC_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::RebalancePoolEvent",

    HASUI_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",

    WUSDC_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",

    WUSDC_WBTC_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor_base_a::RebalancePoolEvent",

    WETH_WUSDC_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::RebalancePoolEvent",

    NAVX_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",

    BUCK_WUSDC_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::RebalancePoolEvent",

    CETUS_SUI_POOL_REBALANCE_EVENT:
      "0x1a22b26f139b34c9de9718cf7e53159b2b939ec8f46f4c040776b7a3d580dd28::alphafi_cetus_sui_investor::RebalancePoolEvent",

    NAVI_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::RebalancePoolEvent",

    ALPHA_WUSDC_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::RebalancePoolEvent",
    WSOL_WUSDC_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::RebalancePoolEvent",
    FUD_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",
    BLUB_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",
    SCA_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",

    USDC_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",

    USDC_USDT_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor_base_a::RebalancePoolEvent",

    ALPHA_USDC_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::RebalancePoolEvent",

    USDC_WUSDC_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor_base_a::RebalancePoolEvent",

    USDC_ETH_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor_base_a::RebalancePoolEvent",

    DEEP_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",

    BUCK_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",

    BUCKET_BUCK_POOL_REBALANCE_EVENT: "",

    ALPHAFI_BLUEFIN_SUI_USDC_POOL_REBALANCE_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_sui_first_investor::RebalancePoolEvent",

    ALPHAFI_BLUEFIN_USDT_USDC_POOL_REBALANCE_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_type_1_investor::RebalancePoolEvent",

    ALPHAFI_BLUEFIN_SUI_BUCK_POOL_REBALANCE_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_sui_first_investor::RebalancePoolEvent",

    ALPHAFI_BLUEFIN_AUSD_USDC_POOL_REBALANCE_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_sui_first_investor::RebalancePoolEvent",
    ALPHA_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphapool::LiquidityChangeEvent",

    ALPHA_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_pool::LiquidityChangeEvent",

    USDT_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_pool::LiquidityChangeEvent",

    USDY_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_pool::LiquidityChangeEvent",

    HASUI_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_pool::LiquidityChangeEvent",

    WUSDC_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_pool::LiquidityChangeEvent",

    WUSDC_WBTC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_pool_base_a::LiquidityChangeEvent",

    WETH_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_pool::LiquidityChangeEvent",

    NAVX_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_pool::LiquidityChangeEvent",

    BUCK_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_pool::LiquidityChangeEvent",

    CETUS_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x1a22b26f139b34c9de9718cf7e53159b2b939ec8f46f4c040776b7a3d580dd28::alphafi_cetus_sui_pool::LiquidityChangeEvent",

    NAVI_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_pool::LiquidityChangeEvent",

    NAVI_VSUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_pool::LiquidityChangeEvent",

    NAVI_WETH_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_pool::LiquidityChangeEvent",

    NAVI_USDT_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_pool::LiquidityChangeEvent",

    NAVI_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_pool::LiquidityChangeEvent",

    NAVI_HASUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_pool::LiquidityChangeEvent",

    NAVI_LOOP_SUI_VSUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x531989a4be74dd43b25e7bb1eeade871f4524bdf437a8eaa30b4ac2a932b5579::alphafi_navi_sui_vsui_pool::LiquidityChangeNewNewEvent",

    NAVI_LOOP_USDC_USDT_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x596639cb12dc5731890063eea58cc631bd6608f49bd338da96181f4265bf8f18::alphafi_navi_native_usdc_usdt_pool::LiquidityChangeEvent",

    ALPHA_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::LiquidityChangeEvent",

    WSOL_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::LiquidityChangeEvent",

    FUD_SUI_POOL_LIQUIDITY_CHANGE_EVENT: "",

    BLUB_SUI_POOL_LIQUIDITY_CHANGE_EVENT: "",

    SCA_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::LiquidityChangeEvent",

    NAVI_USDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_pool::LiquidityChangeEvent",

    USDC_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_pool::LiquidityChangeEvent",

    USDC_USDT_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_pool_base_a::LiquidityChangeEvent",

    ALPHA_USDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::LiquidityChangeEvent",

    USDC_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_pool_base_a::LiquidityChangeEvent",

    USDC_ETH_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_pool_base_a::LiquidityChangeEvent",

    DEEP_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_pool::LiquidityChangeEvent",

    BUCK_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_pool::LiquidityChangeEvent",

    BUCKET_BUCK_POOL_LIQUIDITY_CHANGE_EVENT:
      "0xa095412a92ff0f063cbea962f2f88b1a93cbc85c72bebf5dd7d90a8e2d6375ae::alphafi_bucket_pool_v1::LiquidityChangeEvent",

    NAVI_USDY_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_pool::LiquidityChangeEvent",
    NAVI_AUSD_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x5d90d17172b9e38da9f13a982668a9e48d0b0b5f864e421b60686f60758b37bd::alphafi_navi_pool_v2::LiquidityChangeEvent",
    NAVI_ETH_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x5d90d17172b9e38da9f13a982668a9e48d0b0b5f864e421b60686f60758b37bd::alphafi_navi_pool_v2::LiquidityChangeEvent",
    NAVI_LOOP_HASUI_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0xb7039e74683423783f5179d6359df115af06b040bc439cbef3b307bdaceb050d::alphafi_navi_hasui_sui_pool::LiquidityChangeEvent",
    ALPHAFI_BLUEFIN_SUI_USDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_sui_first_pool::LiquidityChangeEvent",
    ALPHAFI_BLUEFIN_USDT_USDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_type_1_pool::LiquidityChangeEvent",
    NAVI_LOOP_USDT_USDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0xe516e0c12e56619c196fa0ee28d57e5e4ca532bd39df79bee9dcd1e3946119ec::alphafi_navi_usdt_usdc::LiquidityChangeEvent",

    ALPHAFI_BLUEFIN_SUI_BUCK_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_sui_first_pool::LiquidityChangeEvent",

    ALPHAFI_BLUEFIN_AUSD_USDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_sui_first_pool::LiquidityChangeEvent",
    NAVI_NS_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x5d90d17172b9e38da9f13a982668a9e48d0b0b5f864e421b60686f60758b37bd::alphafi_navi_pool_v2::LiquidityChangeEvent",
    // WithdrawV2 Events
    ALPHA_POOL_WITHDRAW_V2_EVENT:
      "0x904f7b5fc4064adc1a3d49b263abe683660ba766f78abd84a454c37c1f102218::alphapool::WithdrawEventV2",

    // After Transaction Event Types
    ALPHA_POOL_AFTER_TRANSACTION_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphapool::BeforeAndAfterEvent",

    ALPHA_SUI_POOL_AFTER_TRANSACTION_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::AfterTransactionEvent",

    USDT_WUSDC_POOL_AFTER_TRANSACTION_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::AfterTransactionEvent",

    USDY_WUSDC_POOL_AFTER_TRANSACTION_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::AfterTransactionEvent",

    HASUI_SUI_POOL_AFTER_TRANSACTION_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::AfterTransactionEvent",

    WUSDC_SUI_POOL_AFTER_TRANSACTION_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::AfterTransactionEvent",

    WUSDC_WBTC_POOL_AFTER_TRANSACTION_EVENT:
      "0x2793db7aa0e0209afc84f0adb1b258973cf1c9da55c35ee85c18f2ed4912bb6f::alphafi_cetus_pool_base_a::AfterTransactionEvent",

    WETH_WUSDC_POOL_AFTER_TRANSACTION_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::AfterTransactionEvent",

    NAVX_SUI_POOL_AFTER_TRANSACTION_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::AfterTransactionEvent",

    BUCK_WUSDC_POOL_AFTER_TRANSACTION_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::AfterTransactionEvent",

    NAVI_SUI_POOL_AFTER_TRANSACTION_EVENT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::AfterTransactionEvent",

    NAVI_VSUI_POOL_AFTER_TRANSACTION_EVENT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::AfterTransactionEvent",

    NAVI_WETH_POOL_AFTER_TRANSACTION_EVENT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::AfterTransactionEvent",

    NAVI_USDT_POOL_AFTER_TRANSACTION_EVENT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::AfterTransactionEvent",

    NAVI_WUSDC_POOL_AFTER_TRANSACTION_EVENT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::AfterTransactionEvent",

    NAVI_HASUI_POOL_AFTER_TRANSACTION_EVENT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::AfterTransactionEvent",
    CETUS_ADD_LIQUIDITY_EVENT:
      "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::pool::AddLiquidityEvent",
    CETUS_REMOVE_LIQUIDITY_EVENT:
      "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::pool::RemoveLiquidityEvent",
    CETUS_COLLECT_FEE_EVENT:
      "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::pool::CollectFeeEvent",
    CETUS_COLLECT_REWARD_EVENT:
      "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::pool::CollectRewardEvent",
    CETUS_SWAP_EVENT:
      "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::pool::SwapEvent",

    // Navi Events
    NAVI_POOL_DEPOSIT_EVENT:
      "0xd899cf7d2b5db716bd2cf55599fb0d5ee38a3061e7b6bb6eebf73fa5bc4c81ca::pool::PoolDeposit",
    NAVI_POOL_WITHDRAW_EVENT:
      "0xd899cf7d2b5db716bd2cf55599fb0d5ee38a3061e7b6bb6eebf73fa5bc4c81ca::pool::PoolWithdraw",

    // Wallets

    AIRDROP_WALLET_ADDRESS:
      "0x6b3a7df97bcad34c277106fef70444fa26e2bfbcd711c9c26f824869a66bb70a",

    SWAP_FEE_ADDRESS: "",

    // BLUEFIN OBJECTS

    // BLUEFIN OBJECTS
    BLUEFIN_GLOBAL_CONFIG:
      "0x03db251ba509a8d5d8777b6338836082335d93eecbdd09a11e190a1cff51c352",
    BLUEFIN_SUI_USDC_POOL:
      "0x3b585786b13af1d8ea067ab37101b6513a05d2f90cfe60e8b1d9e1b46a63c4fa",
    BLUEFIN_USDT_USDC_POOL:
      "0x0321b68a0fca8c990710d26986ba433d06b351deba9384017cd6175f20466a8f",
    BLUEFIN_DEEP_SUI_POOL:
      "0x8a37164afb2474185d182c7119e878f5b4a669d20d39d14b315506d4fdc350bd",
    BLUEFIN_SUI_BUCK_POOL:
      "0xe63329f43a9474d421be85ff270bafc04667b811d215d4d4ee2512bcf2713896",
    BLUEFIN_AUSD_USDC_POOL:
      "0x881639630836b703aa3e04898f8a3740584859838d986619d0ee0f63a784c078",

    // constants for haedel

    HAEDEL_STAKING:
      "0x47b224762220393057ebf4f70501b6e657c3e56684737568439a04f80849b2ca",

    //constants for bucket

    BUCKET_PROTOCOL:
      "0x9e3dab13212b27f5434416939db5dec6a319d15b89a84fd074d03ece6350d3df",
    FOUNTAIN:
      "0xbdf91f558c2b61662e5839db600198eda66d502e4c10c4fc5c683f9caca13359",
    FLASK: "0xc6ecc9731e15d182bc0a46ebe1754a779a4bfb165c201102ad51a36838a1a7b8",

    // constants for kriya

    KRIYA_VSUI_SUI_POOL:
      "0xf1b6a7534027b83e9093bec35d66224daa75ea221d555c79b499f88c93ea58a9",

    KRIYA_VERSION:
      "0xf5145a7ac345ca8736cf8c76047d00d6d378f30e81be6f6eb557184d9de93c78",

    // Constants for Navi Protocol",

    NAVI_STORAGE:
      "0xbb4e2f4b6205c2e2a2db47aeb4f830796ec7c005f88537ee775986639bc442fe",

    NAVI_SUI_POOL:
      "0x96df0fce3c471489f4debaaa762cf960b3d97820bd1f3f025ff8190730e958c5",

    NAVI_VSUI_BORROW_POOL:
      "0x9790c2c272e15b6bf9b341eb531ef16bcc8ed2b20dfda25d060bf47f5dd88d01",

    NAVI_VSUI_POOL:
      "0x9790c2c272e15b6bf9b341eb531ef16bcc8ed2b20dfda25d060bf47f5dd88d01",

    NAVI_WETH_POOL:
      "0x71b9f6e822c48ce827bceadce82201d6a7559f7b0350ed1daa1dc2ba3ac41b56",

    NAVI_WUSDC_POOL:
      "0xa02a98f9c88db51c6f5efaaf2261c81f34dd56d86073387e0ef1805ca22e39c8",
    NAVI_USDC_POOL:
      "0xa3582097b4c57630046c0c49a88bfc6b202a3ec0a9db5597c31765f7563755a8",
    NAVI_USDY_POOL:
      "0x4b6253a9f8cf7f5d31e6d04aed4046b9e325a1681d34e0eff11a8441525d4563",
    NAVI_AUSD_POOL:
      "0xc9208c1e75f990b2c814fa3a45f1bf0e85bb78404cfdb2ae6bb97de58bb30932",
    NAVI_ETH_POOL:
      "0x78ba01c21d8301be15690d3c30dc9f111871e38cfb0b2dd4b70cc6052fba41bb",

    NAVI_HASUI_POOL:
      "0x6fd9cb6ebd76bc80340a9443d72ea0ae282ee20e2fd7544f6ffcd2c070d9557a",

    NAVI_NS_POOL:
      "0x2fcc6245f72795fad50f17c20583f8c6e81426ab69d7d3590420571364d080d4",

    NAVI_WUSDC_BORROW_POOL: "",

    NAVI_USDT_POOL:
      "0x0e060c3b5b8de00fb50511b7a45188c8e34b6995c01f69d98ea5a466fe10d103",

    NAVI_USDT_BORROW_POOL: "",

    NAVI_INCENTIVE_V1:
      "0xaaf735bf83ff564e1b219a0d644de894ef5bdc4b2250b126b2a46dd002331821",

    NAVI_INCENTIVE_V2:
      "0xf87a8acb8b81d14307894d12595541a73f19933f88e1326d5be349c7a6f7559c",

    NAVI_VSUI_FUNDS_POOL:
      "0xe2b5ada45273676e0da8ae10f8fe079a7cec3d0f59187d3d20b1549c275b07ea",

    NAVI_NAVX_FUNDS_POOL:
      "0x9dae0cf104a193217904f88a48ce2cf0221e8cd9073878edd05101d6b771fa09",

    NAVI_NS_FUNDS_POOL:
      "0xbc14736bbe4ac59a4e3af6835a98765c15c5f7dbf9e7ba9b36679ce7ff00dc19",

    // constants for Scallop Protocol

    SCALLOP_VERSION:
      "0x07871c4b3c847a0f674510d4978d5cf6f960452795e8ff6f189fd2088a3f6ac7",

    SCALLOP_MARKET:
      "0xa757975255146dc9686aa823b7838b507f315d704f428cbadad2f4ea061939d9",

    SCALLOP_SUI_SPOOL:
      "0x69ce8e537e750a95381e6040794afa5ab1758353a1a2e1de7760391b01f91670",

    SCALLOP_SUI_REWARDS_POOL:
      "0xbca914adce058ad0902c7f3cfcd698392a475f00dcfdc3f76001d0370b98777a",

    SCALLOP_WUSDC_SPOOL:
      "0x4ace6648ddc64e646ba47a957c562c32c9599b3bba8f5ac1aadb2ae23a2f8ca0",

    SCALLOP_WUSDC_REWARDS_POOL:
      "0xf4268cc9b9413b9bfe09e8966b8de650494c9e5784bf0930759cfef4904daff8",

    SCALLOP_USDT_SPOOL:
      "0xcb328f7ffa7f9342ed85af3fdb2f22919e1a06dfb2f713c04c73543870d7548f",

    SCALLOP_USDT_REWARDS_POOL:
      "0x2c9f934d67a5baa586ceec2cc24163a2f049a6af3d5ba36b84d8ac40f25c4080",

    // Event-related Timestamps
    // format: module_event_start/end
    ALPHA_MODULE_DEPOSIT_EVENT_END_TIME: 1724074240881,
    NAVI_MODULE_LIQUIDITY_CHANGE_EVENT_START_TIME: 1724077830387,

    //Hop Contants

    HOP_QUERY_WALLET:
      "0x4260738f0f7341adc79a8edaa62f8a4681ebd27c595aecab1f322f47bfc52c5e", // used only for querying Hop for quote.

    HOP_FEE_BPS: 0,

    HOP_NETWORK: "mainnet",

    TREASURY_ADDRESS: "",

    DEFUNCT_POOLS: [],
  },

  production: {
    // General Contants
    MS_IN_A_DAY: 864_00_000,

    HALF_MUL: 1000000000000000000,

    HOP_API_KEY: "hopapiJrsprQopziLlhXKFPGV98ECGjBTcsxx5",

    HOP_MAX_SLIPPAGE_BPS: 100,

    DEFAULT_HOP_SLIPPAGE: 1,

    DEFAULT_CETUS_SLIPPAGE: 1,

    DEFAULT_SWAP_SLIPPAGE: 1,

    SUI_NETWORK: "mainnet",

    CLOCK_PACKAGE_ID: "0x6",

    PRICE_ORACLE:
      "0x1568865ed9a0b5ec414220e8f79b3d04c77acc82358f6e5ae4635687392ffbef",

    ALPHA_XUSDC_COIN_TYPE: "",

    ALPHA_XUSDT_COIN_TYPE: "",

    ALPHAFI_EMERGENCY_CAP: "",

    FEE_ADDRESS:
      "0xee5360c5fa13555cbf355cb5015b865d742040e42ff90c324e11f0c63e504545",

    TREASURY_ADDRESS:
      "0x5a9fac4148605191b8e0de25a6671ba8008c344c1558bbaac73a947bd6c903b1",
    SWAP_FEE_ADDRESS:
      "0x401c29204828bed9a2f9f65f9da9b9e54b1e43178c88811e2584e05cf2c3eb6f",

    // constants for Alpha Protocol

    ALPHA_FIRST_PACKAGE_ID:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123",

    ALPHA_PACKAGE_IDS: [
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123",
      "0x7305ab61391388275514b3195554e1dd5b72aae1d4e6f1103b0600a848b0f36f",
      "0x5818295b2823f6f1be62abb7326abeddea01ca51c088f5d45a1853116a26d65d",
      "0x34454fd287c11c45c3c035083cdc84d7498d5a62541987098f8f47e443ac02fe",
      "0xad579dde7a98ed389171ee7b648296e054c9af4158fa14fca487d961d4702380",
      "0x2793db7aa0e0209afc84f0adb1b258973cf1c9da55c35ee85c18f2ed4912bb6f",
      "0x5a26561d7bfe9587d9f9b06194dfa3dc800baa5651705bfd28034d56a202d8e0",
      "0x5cff7cf977811ef57dbd8e3c211c9e9336bd72c8c366ec381957238ebc60c132",
      "0x961465e883920bf201f24c3b6b24c6ab5752795609fa4a66be563be8658aac44",
      "0x771dc108bc4ed5266ae32f678f41031c02afe5e96754a8c8d65866eccfd29e30",
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3",
      "0x7666ad8f8b0201c0a33cc5b3444167c9bd4a029393e3807adc2f82df016d5cea",
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08",
      "0x56bc83b712d9aabf4474f95783d00ce1cffd11bd2bd91cbe166e29b2142bc92f",
      "0x904f7b5fc4064adc1a3d49b263abe683660ba766f78abd84a454c37c1f102218",
      "0x01fa35726cfd42ceb05932c7b77c9cc6e5374c077eed5ef23909866184306a3e",
    ],
    ALPHA_MODULE_PACKAGE_IDS: [
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123",
      "0x2793db7aa0e0209afc84f0adb1b258973cf1c9da55c35ee85c18f2ed4912bb6f",
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3",
    ],

    ALPHA_LATEST_PACKAGE_ID:
      "0x01fa35726cfd42ceb05932c7b77c9cc6e5374c077eed5ef23909866184306a3e",

    ALPHA_2_FIRST_PACKAGE_ID:
      "0x1a22b26f139b34c9de9718cf7e53159b2b939ec8f46f4c040776b7a3d580dd28",

    ALPHA_2_LATEST_PACKAGE_ID:
      "0x4f7d530f5bf6359f9d6d9eafb5e144a174ccc8b875d65c2ea7cf16a8c692b721", // looping pools, cetus sui pool

    ALPHA_2_MODULE_PACKAGE_IDS: [
      "0x1a22b26f139b34c9de9718cf7e53159b2b939ec8f46f4c040776b7a3d580dd28",
      "0x531989a4be74dd43b25e7bb1eeade871f4524bdf437a8eaa30b4ac2a932b5579",
      "0xad4f82d9956085bdab812d46fb2ea4d95c35e9e936cb53d04a79d3989ef97774",
      "0xb7039e74683423783f5179d6359df115af06b040bc439cbef3b307bdaceb050d",
    ],

    ALPHA_2_PACKAGE_IDS: [
      "0x1a22b26f139b34c9de9718cf7e53159b2b939ec8f46f4c040776b7a3d580dd28",
      "0x531989a4be74dd43b25e7bb1eeade871f4524bdf437a8eaa30b4ac2a932b5579",
      "0x2ef944a34bec2416e485de93823b31f2f15dae4efecadeed536b605e9fc2b37a",
      "0x6f3a528c0d639d1b54f5d495a616e0e7fdaf18d36e275189cb3c7e98d5efd5d9",
      "0x5ca137f54c65af77e946d797c3ffcb9a4b88dc49be7b149b7c3e2f89b371ac66",
      "0xa1926ee9753073c0c751c2456934a00b4efa039942db82a2b861c6628d74e42c",
      "0xad4f82d9956085bdab812d46fb2ea4d95c35e9e936cb53d04a79d3989ef97774",
      "0x596639cb12dc5731890063eea58cc631bd6608f49bd338da96181f4265bf8f18",
      "0xb7039e74683423783f5179d6359df115af06b040bc439cbef3b307bdaceb050d",
      "0xb01692159686f46d9f7c97aac0defad8e0d09ee4dff213324e3f159f2cb5103a",
      "0x4f7d530f5bf6359f9d6d9eafb5e144a174ccc8b875d65c2ea7cf16a8c692b721",
    ],

    ALPHA_3_FIRST_PACKAGE_ID:
      "0xa095412a92ff0f063cbea962f2f88b1a93cbc85c72bebf5dd7d90a8e2d6375ae",
    ALPHA_3_LATEST_PACKAGE_ID:
      "0x5d90d17172b9e38da9f13a982668a9e48d0b0b5f864e421b60686f60758b37bd",

    ALPHA_3_MODULE_PACKAGE_IDS: [
      "0xa095412a92ff0f063cbea962f2f88b1a93cbc85c72bebf5dd7d90a8e2d6375ae", // bucket
      "0x5d90d17172b9e38da9f13a982668a9e48d0b0b5f864e421b60686f60758b37bd", // navi v2
    ],
    ALPHA_3_PACKAGE_IDS: [
      "0xa095412a92ff0f063cbea962f2f88b1a93cbc85c72bebf5dd7d90a8e2d6375ae",
      "0x5d90d17172b9e38da9f13a982668a9e48d0b0b5f864e421b60686f60758b37bd",
    ],

    ALPHA_4_FIRST_PACKAGE_ID:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b",
    ALPHA_4_LATEST_PACKAGE_ID:
      "0xbf457c0b6582c072a3543dd639d5b6c12f8e73b3818881158d4da0d25a946399",

    ALPHA_4_MODULE_PACKAGE_IDS: [
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b",
    ],

    ALPHA_4_PACKAGE_IDS: [
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b",
      "0x9a54ac5a14bbf4f79ab0d0bbf0a84c268a5553cb8ae4f9539c47b79248d69de2",
      "0xc4d202e7aec959d021b4ff73d3fafae49d4efecb6215c031c2cf3e635d81a459",
      "0x34ab711c006675e0b26c535d42e7feb78bad3be5b4243dcb6266e7a044fa1f9a",
      "0xbf457c0b6582c072a3543dd639d5b6c12f8e73b3818881158d4da0d25a946399",
    ],
    ALPHA_5_FIRST_PACKAGE_ID:
      "0xe516e0c12e56619c196fa0ee28d57e5e4ca532bd39df79bee9dcd1e3946119ec",
    ALPHA_5_LATEST_PACKAGE_ID:
      "0xe516e0c12e56619c196fa0ee28d57e5e4ca532bd39df79bee9dcd1e3946119ec",

    ALPHA_5_MODULE_PACKAGE_IDS: [
      "0xe516e0c12e56619c196fa0ee28d57e5e4ca532bd39df79bee9dcd1e3946119ec",
    ],
    ALPHA_5_PACKAGE_IDS: [
      "0xe516e0c12e56619c196fa0ee28d57e5e4ca532bd39df79bee9dcd1e3946119ec",
    ],

    ALPHA_DISTRIBUTOR:
      "0x33f3c288a90c5368ec3b937875cfae94aebae0ee7fb65e97265728eff9e6995b",

    VERSION:
      "0xf9c533b483c656d29aad9b2ee48ea418dde9504fb42c8294298bf523026bf043",

    ALPHA_2_VERSION:
      "0xb89716c470af0d16505ff5621e2111f73ac97247c093948660548c3548845aa8", // new package for looping strategy

    ALPHA_3_VERSION:
      "0x6f530e5cb2d3c9d73b823f9d394c248513e4e54f5f8cac3b2ca24c3f2bd3ffe7",

    ALPHA_4_VERSION:
      "0xdce2e00eadac8928fe6b4d7d3ba33e2cdc3c8b4900fa7c5115bb8f3deee030ee",

    ALPHA_5_VERSION:
      "0xa8dce89491194eb551f46c2f9208642147df6e770198641f86891626d008b2a9",

    VOLO_NATIVE_POOL:
      "0x7fa2faa111b8c65bea48a23049bfd81ca8f971a262d981dcd9a17c3825cb5baf",

    VOLO_METADATA:
      "0x680cd26af32b2bde8d3361e804c53ec1d1cfe24c7f039eb7f549e8dfde389a60",

    SUI_SYSTEM_STATE:
      "0x0000000000000000000000000000000000000000000000000000000000000005",

    ALPHA_NAVI_BORROW_FACTOR: 0.95,

    ALPHA_TOKEN_REWARD_SHARE: 0.45,

    ALPHA_PROTOCOL_INFO_OBJECT_ID: "", // TODO

    // Coin Types

    // BETA_COIN_TYPE: "", // always leave it empty here in production
    ALPHA_COIN_TYPE:
      "0xfe3afec26c59e874f3c1d60b8203cb3852d2bb2aa415df9548b8d688e6683f93::alpha::ALPHA",

    SUI_COIN_TYPE: "0x2::sui::SUI",

    USDT_COIN_TYPE:
      "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",

    USDC_COIN_TYPE:
      "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",

    WUSDC_COIN_TYPE:
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",

    VSUI_COIN_TYPE:
      "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT",

    CETUS_COIN_TYPE:
      "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",

    SCALLOP_COIN_TYPE:
      "0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA",

    NAVX_COIN_TYPE:
      "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX",

    USDY_COIN_TYPE:
      "0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY",

    HASUI_COIN_TYPE:
      "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI",

    ALPHA_XSUI_COIN_TYPE:
      "0x07cb3a546202773a06b0b18c9af9c76c8679a2a0fe8d653cecb7dfbf7933e019::xsui::XSUI",

    WBTC_COIN_TYPE:
      "0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN",

    WETH_COIN_TYPE:
      "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN",

    BUCK_COIN_TYPE:
      "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK",

    WSOL_COIN_TYPE:
      "0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN",
    FUD_COIN_TYPE:
      "0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1::fud::FUD",
    BLUB_COIN_TYPE:
      "0xfa7ac3951fdca92c5200d468d31a365eb03b2be9936fde615e69f0c1274ad3a0::BLUB::BLUB",

    DEEP_COIN_TYPE:
      "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP",
    ETH_COIN_TYPE:
      "0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29::eth::ETH",

    AUSD_COIN_TYPE:
      "0x2053d08c1e2bd02791056171aab0fd12bd7cd7efad2ab8f6b9c8902f14df2ff2::ausd::AUSD",

    NS_COIN_TYPE:
      "0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS",

    // Defunct Pools
    DEFUNCT_POOLS: [
      "0xdc4f3d7b45b7b42487879ee7569633a3ed0a4980693934033b76e86398d1e235",
    ],

    // Alpha POOL Id's

    ALPHA_POOL:
      "0x6ee8f60226edf48772f81e5986994745dae249c2605a5b12de6602ef1b05b0c1",

    WUSDC_USDT_POOL:
      "0x30066d9879374276dc01177fbd239a9377b497bcd347c82811d75fcda35b18e5",

    ALPHA_SUI_POOL:
      "0x594f13b8f287003fd48e4264e7056e274b84709ada31e3657f00eeedc1547e37",

    HASUI_SUI_POOL:
      "0xb75f427854fef827233ae838d1c23eefd420a540d8fa83fb40f77421dafb84d4",

    USDY_WUSDC_POOL:
      "0xa7239a0c727c40ee3a139689b16b281acfd0682a06c23531b184a61721ece437",

    ALPHA_USDT_POOL: "",

    WUSDC_SUI_POOL:
      "0xee6f6392cbd9e1997f6e4cf71db0c1ae1611f1f5f7f23f90ad2c64b8f23cceab",

    WETH_WUSDC_POOL:
      "0xbdf4f673b34274f36be284bca3f765083380fefb29141f971db289294bf679c6",

    WUSDC_WBTC_POOL:
      "0x676fc5cad79f51f6a7d03bfa3474ecd3c695d322380fc68e3d4f61819da3bf8a",

    NAVX_SUI_POOL:
      "0x045e4e3ccd383bedeb8fda54c39a7a1b1a6ed6a9f66aec4998984373558f96a0",

    BUCK_WUSDC_POOL:
      "0x59ff9c5df31bfd0a59ac8393cf6f8db1373252e845958953e6199952d194dae4",

    CETUS_SUI_POOL:
      "0xa87297a4a8aa38848955195340ba40ba4eef476d4204c34a9297efcd37c21264",

    ALPHA_WUSDC_POOL:
      "0x430986b53a787362e54fa83d0ae046a984fb4285a1bc4fb1335af985f4fe019d",
    WSOL_WUSDC_POOL:
      "0xd50ec46c2514bc8c588760aa7ef1446dcd37993bc8a3f9e93563af5f31b43ffd",
    FUD_SUI_POOL:
      "0x005a2ebeb982a1e569a54795bce1eeb4d88900b674440f8487c2846da1706182",
    BLUB_SUI_POOL: "",
    SCA_SUI_POOL:
      "0x6eec371c24ad264ced3a1f40b83d7d720aa2b0afa860a6af85436f6a769842e1",

    USDC_SUI_POOL:
      "0x727882553d1ab69b0cabad2984331e7e39445f91cb4046bf7113c36980685528",

    USDC_USDT_POOL:
      "0xa213f04c6049f842a7ffe7d39e0c6138a863dc6e25416df950d23ddb27d75661",

    ALPHA_USDC_POOL:
      "0x4c0e42f1826170ad9283b321a7f9a453ef9f65aaa626f7d9ee5837726664ecdc",
    USDC_WUSDC_POOL:
      "0x568a47adf2b10219f0973a5600096822b38b4a460c699431afb6dad385614d66",
    USDC_ETH_POOL:
      "0xc04f71f32a65ddf9ebf6fb69f39261457da28918bfda5d3760013f3ea782a594",
    DEEP_SUI_POOL:
      "0xff496f73a1f9bf7461882fbdad0c6c6c73d301d3137932f7fce2428244359eaa",
    BUCK_SUI_POOL:
      "0xeb44ecef39cc7873de0c418311557c6b8a60a0af4f1fe1fecece85d5fbe02ab5",

    // Alphafi-Navi Pools

    ALPHAFI_NAVI_SUI_POOL:
      "0x643f84e0a33b19e2b511be46232610c6eb38e772931f582f019b8bbfb893ddb3",
    ALPHAFI_NAVI_VSUI_POOL:
      "0x0d9598006d37077b4935400f6525d7f1070784e2d6f04765d76ae0a4880f7d0a",
    ALPHAFI_NAVI_WETH_POOL:
      "0xe4eef7d4d8cafa3ef90ea486ff7d1eec347718375e63f1f778005ae646439aad",
    ALPHAFI_NAVI_USDT_POOL:
      "0xc696ca5b8f21a1f8fcd62cff16bbe5a396a4bed6f67909cfec8269eb16e60757",
    ALPHAFI_NAVI_WUSDC_POOL:
      "0x01493446093dfcdcfc6c16dc31ffe40ba9ac2e99a3f6c16a0d285bff861944ae",
    ALPHAFI_NAVI_USDC_POOL:
      "0x04378cf67d21b41399dc0b6653a5f73f8d3a03cc7643463e47e8d378f8b0bdfa",
    ALPHAFI_NAVI_HASUI_POOL: "",
    ALPHAFI_NAVI_LOOP_SUI_VSUI_POOL:
      "0xd013a1a0c6f2bad46045e3a1ba05932b4a32f15864021d7e0178d5c2fdcc85e3",
    ALPHAFI_NAVI_LOOP_USDC_USDT_POOL:
      "0xb90c7250627e0113df2e60d020df477cac14ca78108e3c5968230f3e7d4d8846",
    ALPHAFI_NAVI_USDY_POOL:
      "0xea3c2a2d29144bf8f22e412ca5e2954c5d3021d3259ff276e3b62424a624ad1f",
    ALPHAFI_NAVI_AUSD_POOL:
      "0x8ebe04b51e8a272d4db107ad19cfbc184d1dafeeaab0b61c26e613b804e7777a",
    ALPHAFI_NAVI_ETH_POOL:
      "0xc37ec956fdef6c217505e62444ab93f833c20923755d67d1c8588c9b093ae00e",
    ALPHAFI_NAVI_LOOP_HASUI_SUI_POOL:
      "0x4b22c2fc59c7697eea08c1cc1eadf231415d66b842875ba4730a8619efa38ced",
    ALPHAFI_NAVI_LOOP_USDT_USDC_POOL:
      "0xdd886dd4828a44b7ae48bb7eaceca1cecedd1dcc06174f66ee398dc0feb71451",

    ALPHAFI_NAVI_NS_POOL: "",

    //alphafi bucket pools

    BUCKET_BUCK_POOL:
      "0x2c5c14b9fb21f93f36cac0f363acf59ecb21f34c4c9b1a1b383f635ecdc7b507",

    // alphafi bluefin pools

    ALPHAFI_BLUEFIN_SUI_USDC_POOL:
      "0x99b9bd1d07690a658b9723509278b83715f7c4bec2bc5983316c002b597dfabd",
    ALPHAFI_BLUEFIN_USDT_USDC_POOL:
      "0x8d9220587b2969429c517e76b3695f01cb3749849d69937c4140a6715bf14c7f",
    ALPHAFI_BLUEFIN_SUI_BUCK_POOL:
      "0x58c4a8c5d18c61156e1a5a82811fbf71963a4de3f5d52292504646611a308888",
    ALPHAFI_BLUEFIN_AUSD_USDC_POOL:
      "0x8ed765497eeedf7960af787c0c419cb2c01c471ab47682a0619e8588c06a9aa6",

    // CETUS Pool Id's

    WUSDC_SUI_CETUS_POOL_ID:
      "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630",

    USDC_SUI_CETUS_POOL_ID:
      "0xb8d7d9e66a60c239e7a60110efcf8de6c705580ed924d0dde141f4a0e2c90105",

    CETUS_SUI_CETUS_POOL_ID:
      "0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded",

    USDC_USDT_CETUS_POOL_ID:
      "0x6bd72983b0b5a77774af8c77567bb593b418ae3cd750a5926814fcd236409aaa",

    USDT_WUSDC_CETUS_POOL_ID:
      "0xc8d7a1503dc2f9f5b05449a87d8733593e2f0f3e7bffd90541252782e4d2ca20",

    ALPHA_SUI_CETUS_POOL_ID:
      "0xda7347c3192a27ddac32e659c9d9cbed6f8c9d1344e605c71c8886d7b787d720",

    USDY_WUSDC_CETUS_POOL_ID:
      "0x0e809689d04d87f4bd4e660cd1b84bf5448c5a7997e3d22fc480e7e5e0b3f58d",

    HASUI_SUI_CETUS_POOL_ID:
      "0x871d8a227114f375170f149f7e9d45be822dd003eba225e83c05ac80828596bc",

    WUSDC_WBTC_CETUS_POOL_ID:
      "0xaa57c66ba6ee8f2219376659f727f2b13d49ead66435aa99f57bb008a64a8042",

    WETH_WUSDC_CETUS_POOL_ID:
      "0x5b0b24c27ccf6d0e98f3a8704d2e577de83fa574d3a9060eb8945eeb82b3e2df",

    WETH_SUI_CETUS_POOL_ID:
      "0xc51752c87e7363dec32bb429cabcb7774aaabb45fa5d2c17edfbb59bd6d1deb0",

    WBTC_SUI_CETUS_POOL_ID:
      "0xe0c526aa27d1729931d0051a318d795ad0299998898e4287d9da1bf095b49658",

    VSUI_SUI_CETUS_POOL_ID:
      "0x6c545e78638c8c1db7a48b282bb8ca79da107993fcb185f75cedc1f5adb2f535",
    NAVX_SUI_CETUS_POOL_ID:
      "0x0254747f5ca059a1972cd7f6016485d51392a3fde608107b93bbaebea550f703",

    WUSDC_CETUS_CETUS_POOL_ID:
      "0x238f7e4648e62751de29c982cbf639b4225547c31db7bd866982d7d56fc2c7a8",

    BUCK_WUSDC_CETUS_POOL_ID:
      "0x81fe26939ed676dd766358a60445341a06cea407ca6f3671ef30f162c84126d5",

    ALPHA_WUSDC_CETUS_POOL_ID:
      "0x0cbe3e6bbac59a93e4d358279dff004c98b2b8da084729fabb9831b1c9f71db6",
    WSOL_WUSDC_CETUS_POOL_ID:
      "0x9ddb0d269d1049caf7c872846cc6d9152618d1d3ce994fae84c1c051ee23b179",
    FUD_SUI_CETUS_POOL_ID:
      "0xfc6a11998f1acf1dd55acb58acd7716564049cfd5fd95e754b0b4fe9444f4c9d",
    BLUB_SUI_CETUS_POOL_ID:
      "0x40a372f9ee1989d76ceb8e50941b04468f8551d091fb8a5d7211522e42e60aaf",
    SCA_SUI_CETUS_POOL_ID:
      "0xaa72bd551b25715b8f9d72f226fa02526bdf2e085a86faec7184230c5209bb6e",

    ALPHA_USDC_CETUS_POOL_ID:
      "0x29e218b46e35b4cf8eedc7478b8795d2a9bcce9c61e11101b3a039ec93305126",

    USDC_WUSDC_CETUS_POOL_ID:
      "0x1efc96c99c9d91ac0f54f0ca78d2d9a6ba11377d29354c0a192c86f0495ddec7",

    DEEP_SUI_CETUS_POOL_ID:
      "0xe01243f37f712ef87e556afb9b1d03d0fae13f96d324ec912daffc339dfdcbd2",
    USDC_ETH_CETUS_POOL_ID:
      "0x9e59de50d9e5979fc03ac5bcacdb581c823dbd27d63a036131e17b391f2fac88",

    BUCK_SUI_CETUS_POOL_ID:
      "0x59cf0d333464ad29443d92bfd2ddfd1f794c5830141a5ee4a815d1ef3395bf6c",

    USDC_BUCK_CETUS_POOL_ID:
      "0x4c50ba9d1e60d229800293a4222851c9c3f797aa5ba8a8d32cc67ec7e79fec60",

    USDC_AUSD_CETUS_POOL_ID:
      "0x0fea99ed9c65068638963a81587c3b8cafb71dc38c545319f008f7e9feb2b5f8",

    NS_SUI_CETUS_POOL_ID:
      "0x763f63cbada3a932c46972c6c6dcf1abd8a9a73331908a1d7ef24c2232d85520",

    //Cetus Info Id's

    CETUS_REWARDER_GLOBAL_VAULT_ID:
      "0xce7bceef26d3ad1f6d9b6f13a953f053e6ed3ca77907516481ce99ae8e588f2b",

    CETUS_GLOBAL_CONFIG_ID:
      "0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f",

    // Cetus Investor Id's

    ALPHA_CETUS_INVESTOR: "",

    USDT_WUSDC_CETUS_INVESTOR:
      "0x87a76889bf4ed211276b16eb482bf6df8d4e27749ebecd13017d19a63f75a6d5",

    ALPHA_SUI_CETUS_INVESTOR:
      "0x46d901d5e1dba34103038bd2ba789b775861ea0bf4d6566afd5029cf466a3d88",

    HASUI_SUI_CETUS_INVESTOR:
      "0x0805991383c8a5e1bbb1c2b8d824d205fdb66509a2c408f505bc16cbbdb909ab",

    USDY_WUSDC_CETUS_INVESTOR:
      "0x1b923520f19660d4eb013242c6d03c84fdea034b8f784cfd71173ef72ece50e1",

    ALPHA_USDT_CETUS_INVESTOR: "",

    WUSDC_SUI_CETUS_INVESTOR:
      "0xb6ca8aba0fb26ed264a3ae3d9c1461ac7c96cdcbeabb01e71086e9a8340b9c55",

    WUSDC_WBTC_CETUS_INVESTOR:
      "0x9ae0e56aa0ebc27f9d8a17b5a9118d368ba262118d878977b6194a10a671bbbc",

    WETH_WUSDC_CETUS_INVESTOR:
      "0x05fa099d1df7b5bfb2e420d5ee2d63508db17c40ce7c4e0ca0305cd5df974e43",

    NAVX_SUI_CETUS_INVESTOR:
      "0xdd9018247d579bd7adfdbced4ed39c28821c6019461d37dbdf32f0d409959b1c",

    BUCK_WUSDC_CETUS_INVESTOR:
      "0x8051a9ce43f9c21e58331b1ba2b1925e4ae4c001b1400459236d86d5d3d2888b",

    CETUS_SUI_CETUS_INVESTOR:
      "0xd060e81548aee885bd3d37ae0caec181185be792bf45412e0d0acccd1e0174e6",

    ALPHA_WUSDC_CETUS_INVESTOR:
      "0x705c560fd1f05c64e0480af05853e27e1c3d04e255cd6c5cb6921f5d1df12b5a",

    WSOL_WUSDC_CETUS_INVESTOR:
      "0x74308f0de7ea1fc4aae2046940522f8f79a6a76db94e1227075f1c2343689882",
    FUD_SUI_CETUS_INVESTOR:
      "0xaa17ff01024678a94381fee24d0021a96d4f3a11855b0745facbb5d2eb9df730",
    BLUB_SUI_CETUS_INVESTOR: "",

    SCA_SUI_CETUS_INVESTOR:
      "0x651acc1166023a08c17f24e71550982400e9b1f4950cc1324410300efc1af905",

    USDC_SUI_CETUS_INVESTOR:
      "0xba6acd0350eab1c6bc433b6c869e5592fe0667ae96a3115f89d5c79dd78396ef",

    USDC_USDT_CETUS_INVESTOR:
      "0xe553be450b7290025d5810da45102abdbaa211c5735e47f6740b4dd880edc0bd",

    ALPHA_USDC_CETUS_INVESTOR:
      "0xb43d1defd5f76ef084d68d6b56e903b54d0a3b01be8bb920ed1fa84b42c32ee1",

    USDC_WUSDC_CETUS_INVESTOR:
      "0x6cc5e671a2a6e9b8c8635ff1fb16ae62abd7834558c3a632d97f393c0f022972",

    USDC_ETH_CETUS_INVESTOR:
      "0xb0bff60783536f9dc0b38e43150a73b73b8a4f1969446f7721e187821915bd00",

    DEEP_SUI_CETUS_INVESTOR:
      "0x5e195363175e4b5139749d901ddd5ef1ffc751777a7051b558c45fa12f24abc3",

    BUCK_SUI_CETUS_INVESTOR:
      "0x9b7c9b6086d3baf413bccdfbb6f60f04dedd5f5387dee531eef5b811afdfaedc",

    // Navi Investor Ids

    NAVI_SUI_INVESTOR:
      "0x0b4309b0cb8a75747635ae65a7bf3e7d555e7248c17cf8232a40240a415cf78f",

    NAVI_VSUI_INVESTOR:
      "0x5843b3db9f1bc9ee39dd4950507f5466f24f1b110b8c6b1d7aa8502ce8ca4ac4",

    NAVI_WETH_INVESTOR:
      "0xaef988b8bcd85f319817579cfeaf94b13c2113d4b670f9ed66326d97a3f9d76f",

    NAVI_USDT_INVESTOR:
      "0xc3b2ba8d15fe77bada328ede3219aa8b746832932f7372f974313c841bb6693f",

    NAVI_WUSDC_INVESTOR:
      "0xdf980cacf2ef2f4411f793ee9ee9266af78324b228323ede2ce73f9cf0c301cc",

    NAVI_HASUI_INVESTOR: "",

    NAVI_LOOP_SUI_VSUI_INVESTOR:
      "0x36cc3135c255632f9275a5b594145745f8344ce8f6e46d9991ffb17596195869",

    NAVI_LOOP_USDC_USDT_INVESTOR:
      "0x3b9fe28a07e8dd5689f3762ba45dbdf10bd5f7c85a14432928d9108a61ef2dc2",

    NAVI_USDC_INVESTOR:
      "0x681a30beb23d2532f9413c09127525ae5e562da7aa89f9f3498bd121fef22065",

    NAVI_USDY_INVESTOR:
      "0xf43c62ca04c2f8d4583630872429ba6f5d8a7316ccb9552c86bb1fcf9dee3ce2",
    NAVI_AUSD_INVESTOR:
      "0x227226f22bd9e484e541005916904ca066db1d42b8a80351800ef37b26c6cd89",
    NAVI_ETH_INVESTOR:
      "0x145952d6e903db412c2bd1d8bb25875acd57a772764fba0a97b20e2f7bdcb09c",
    NAVI_LOOP_HASUI_SUI_INVESTOR:
      "0xa65eaadb556a80e4cb02fe35efebb2656d82d364897530f45dabc1e99d15a8a9",

    NAVI_LOOP_USDT_USDC_INVESTOR:
      "0xe512e692f4d48a79abcfd5970ccb44d6f7f149e81bb077ccd58b89d4ab557d0e",

    NAVI_NS_INVESTOR: "",

    //ALPHAFI BUCKET INVESTORS
    BUCKET_BUCK_INVESTOR:
      "0x646f400ef45a3c1c9cd94dd37b3a3388098427a5aff968206bbe6b8f119866e2",

    // ALPHAFI BLUEFIN INVESTORS
    ALPHAFI_BLUEFIN_SUI_USDC_INVESTOR:
      "0x863909d3ced121e06053dec3fd2cb08ecda4c54607ad1b3f4fc8c75267c8012c",
    ALPHAFI_BLUEFIN_USDT_USDC_INVESTOR:
      "0x114bf16bd3504d6f491e35152d54f5340d66d7c6abaca7689b9081cd3af0cd93",
    ALPHAFI_BLUEFIN_SUI_BUCK_INVESTOR:
      "0xc04ef6923ae5cf047cf853d2fa809ab56dbe712ca95f87c5f3c12dcfe66f7ecd",
    ALPHAFI_BLUEFIN_AUSD_USDC_INVESTOR:
      "0x1f9f325dfb23a3516679cd7bda58c26791b2a34c40ce5e1cd88ee6f8361a0ea6",

    // Receipt Types

    ALPHA_POOL_RECEIPT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphapool::Receipt",

    ALPHA_SUI_POOL_RECEIPT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::Receipt",

    USDT_WUSDC_POOL_RECEIPT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::Receipt",

    USDY_WUSDC_POOL_RECEIPT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::Receipt",

    HASUI_SUI_POOL_RECEIPT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::Receipt",

    WUSDC_SUI_POOL_RECEIPT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::Receipt",

    WUSDC_WBTC_POOL_RECEIPT:
      "0x2793db7aa0e0209afc84f0adb1b258973cf1c9da55c35ee85c18f2ed4912bb6f::alphafi_cetus_pool_base_a::Receipt",

    WETH_WUSDC_POOL_RECEIPT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::Receipt",

    NAVX_SUI_POOL_RECEIPT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::Receipt",

    BUCK_WUSDC_POOL_RECEIPT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::Receipt",

    CETUS_SUI_POOL_RECEIPT:
      "0x1a22b26f139b34c9de9718cf7e53159b2b939ec8f46f4c040776b7a3d580dd28::alphafi_cetus_sui_pool::Receipt",

    NAVI_SUI_POOL_RECEIPT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::Receipt",

    NAVI_VSUI_POOL_RECEIPT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::Receipt",

    NAVI_WETH_POOL_RECEIPT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::Receipt",

    NAVI_USDT_POOL_RECEIPT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::Receipt",

    NAVI_WUSDC_POOL_RECEIPT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::Receipt",

    NAVI_HASUI_POOL_RECEIPT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::Receipt",

    NAVI_LOOP_SUI_VSUI_RECEIPT:
      "0x531989a4be74dd43b25e7bb1eeade871f4524bdf437a8eaa30b4ac2a932b5579::alphafi_navi_sui_vsui_pool::Receipt",

    ALPHA_WUSDC_POOL_RECEIPT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::Receipt",
    WSOL_WUSDC_POOL_RECEIPT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::Receipt",
    FUD_SUI_POOL_RECEIPT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::Receipt",
    BLUB_SUI_POOL_RECEIPT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::Receipt",
    SCA_SUI_POOL_RECEIPT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::Receipt",

    NAVI_LOOP_USDC_USDT_RECEIPT:
      "0xad4f82d9956085bdab812d46fb2ea4d95c35e9e936cb53d04a79d3989ef97774::alphafi_navi_native_usdc_usdt_pool::Receipt", // change id

    NAVI_USDC_POOL_RECEIPT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::Receipt",

    USDC_SUI_POOL_RECEIPT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::Receipt",

    USDC_USDT_POOL_RECEIPT:
      "0x2793db7aa0e0209afc84f0adb1b258973cf1c9da55c35ee85c18f2ed4912bb6f::alphafi_cetus_pool_base_a::Receipt",

    ALPHA_USDC_POOL_RECEIPT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::Receipt",
    USDC_WUSDC_POOL_RECEIPT:
      "0x2793db7aa0e0209afc84f0adb1b258973cf1c9da55c35ee85c18f2ed4912bb6f::alphafi_cetus_pool_base_a::Receipt",

    BUCKET_BUCK_POOL_RECEIPT:
      "0xa095412a92ff0f063cbea962f2f88b1a93cbc85c72bebf5dd7d90a8e2d6375ae::alphafi_bucket_pool_v1::Receipt",
    USDC_ETH_POOL_RECEIPT:
      "0x2793db7aa0e0209afc84f0adb1b258973cf1c9da55c35ee85c18f2ed4912bb6f::alphafi_cetus_pool_base_a::Receipt",
    DEEP_SUI_POOL_RECEIPT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::Receipt",

    BUCK_SUI_POOL_RECEIPT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::Receipt",
    NAVI_USDY_POOL_RECEIPT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::Receipt",
    NAVI_AUSD_POOL_RECEIPT:
      "0x5d90d17172b9e38da9f13a982668a9e48d0b0b5f864e421b60686f60758b37bd::alphafi_navi_pool_v2::Receipt",
    NAVI_ETH_POOL_RECEIPT:
      "0x5d90d17172b9e38da9f13a982668a9e48d0b0b5f864e421b60686f60758b37bd::alphafi_navi_pool_v2::Receipt",
    NAVI_LOOP_HASUI_SUI_RECEIPT:
      "0xb7039e74683423783f5179d6359df115af06b040bc439cbef3b307bdaceb050d::alphafi_navi_hasui_sui_pool::Receipt",
    ALPHAFI_BLUEFIN_SUI_USDC_RECEIPT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_sui_first_pool::Receipt",
    ALPHAFI_BLUEFIN_USDT_USDC_RECEIPT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_type_1_pool::Receipt",
    NAVI_LOOP_USDT_USDC_RECEIPT:
      "0xe516e0c12e56619c196fa0ee28d57e5e4ca532bd39df79bee9dcd1e3946119ec::alphafi_navi_usdt_usdc_pool::Receipt",
    ALPHAFI_BLUEFIN_SUI_BUCK_RECEIPT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_sui_first_pool::Receipt",
    ALPHAFI_BLUEFIN_AUSD_USDC_RECEIPT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_type_1_pool::Receipt",
    NAVI_NS_POOL_RECEIPT:
      "0x5d90d17172b9e38da9f13a982668a9e48d0b0b5f864e421b60686f60758b37bd::alphafi_navi_pool_v2::Receipt",

    // Receipt Names

    ALPHA_POOL_RECEIPT_NAME: "AlphaFi ALPHA Receipt",

    ALPHA_SUI_POOL_RECEIPT_NAME: "AlphaFi ALPHA-SUI Receipt",

    USDT_WUSDC_POOL_RECEIPT_NAME: "AlphaFi USDT-USDC Receipt",

    USDY_WUSDC_POOL_RECEIPT_NAME: "AlphaFi USDY-USDC Receipt",

    HASUI_SUI_POOL_RECEIPT_NAME: "AlphaFi haSUI-SUI Receipt",

    WUSDC_SUI_POOL_RECEIPT_NAME: "AlphaFi USDC-SUI Receipt",

    WUSDC_WBTC_POOL_RECEIPT_NAME: "AlphaFi WBTC-USDC Receipt",

    WETH_WUSDC_POOL_RECEIPT_NAME: "AlphaFi WETH-USDC Receipt",

    NAVX_SUI_POOL_RECEIPT_NAME: "AlphaFi NAVX-SUI Receipt",

    BUCK_WUSDC_POOL_RECEIPT_NAME: "AlphaFi BUCK-USDC Receipt",

    CETUS_SUI_POOL_RECEIPT_NAME: "AlphaFi CETUS-SUI Receipt",

    NAVI_SUI_POOL_RECEIPT_NAME: "AlphaFi-Navi SUI Receipt",

    NAVI_VSUI_POOL_RECEIPT_NAME: "AlphaFi-Navi VSUI Receipt",

    NAVI_WETH_POOL_RECEIPT_NAME: "AlphaFi-Navi WETH Receipt",

    NAVI_USDT_POOL_RECEIPT_NAME: "AlphaFi-Navi USDT Receipt",

    NAVI_WUSDC_POOL_RECEIPT_NAME: "AlphaFi-Navi USDC Receipt",

    NAVI_USDC_POOL_RECEIPT_NAME: "AlphaFi-Navi USDC(Native) Receipt",

    NAVI_HASUI_POOL_RECEIPT_NAME: "AlphaFi-Navi HASUI Receipt",

    NAVI_SUI_VSUI_LOOP_RECEIPT_NAME: "AlphaFi-Navi SUI-VSUI Receipt",

    NAVI_USDC_USDT_LOOP_RECEIPT_NAME: "AlphaFi-Navi USDC-USDT Receipt",

    ALPHA_WUSDC_POOL_RECEIPT_NAME: "AlphaFi ALPHA-USDC Receipt",
    WSOL_WUSDC_POOL_RECEIPT_NAME: "AlphaFi WSOL-USDC Receipt",
    FUD_SUI_POOL_RECEIPT_NAME: "AlphaFi FUD-SUI Receipt",
    BLUB_SUI_POOL_RECEIPT_NAME: "AlphaFi BLUB-SUI Receipt",
    SCA_SUI_POOL_RECEIPT_NAME: "AlphaFi SCA-SUI Receipt",

    USDC_SUI_POOL_RECEIPT_NAME: "AlphaFi USDC(Native)-SUI Receipt",
    USDC_USDT_POOL_RECEIPT_NAME: "AlphaFi USDC(Native)-USDT Receipt",

    ALPHA_USDC_POOL_RECEIPT_NAME: "AlphaFi ALPHA-USDC(Native) Receipt",
    USDC_WUSDC_POOL_RECEIPT_NAME: "AlphaFi USDC(Native)-WUSDC Receipt",

    BUCKET_BUCK_POOL_RECEIPT_NAME: "AlphaFi-Bucket BUCK Receipt",
    USDC_ETH_POOL_RECEIPT_NAME: "AlphaFi USDC(Native)-ETH Receipt",
    DEEP_SUI_POOL_RECEIPT_NAME: "AlphaFi DEEP-SUI Receipt",
    BUCK_SUI_POOL_RECEIPT_NAME: "AlphaFi BUCK-SUI Receipt",
    NAVI_USDY_POOL_RECEIPT_NAME: "AlphaFi-Navi USDY Receipt",
    NAVI_AUSD_POOL_RECEIPT_NAME: "AlphaFi-Navi AUSD Receipt",
    NAVI_ETH_POOL_RECEIPT_NAME: "AlphaFi-Navi ETH Receipt",
    NAVI_HASUI_SUI_LOOP_RECEIPT_NAME: "AlphaFi-Navi HASUI-SUI Receipt",
    ALPHAFI_BLUEFIN_SUI_USDC_RECEIPT_NAME: "AlphaFi-Bluefin SUI-USDC Receipt",
    ALPHAFI_BLUEFIN_USDT_USDC_RECEIPT_NAME: "AlphaFi-Bluefin USDT-USDC Receipt",
    NAVI_USDT_USDC_LOOP_RECEIPT_NAME: "AlphaFi-Navi USDT-USDC Receipt",
    ALPHAFI_BLUEFIN_SUI_BUCK_RECEIPT_NAME: "AlphaFi-Bluefin SUI-BUCK Receipt",
    ALPHAFI_BLUEFIN_AUSD_USDC_RECEIPT_NAME: "AlphaFi-Bluefin AUSD-USDC Receipt",
    NAVI_NS_POOL_RECEIPT_NAME: "AlphaFi-Navi NS Receipt",

    //alphafi navi account addresses
    NAVI_USDC_USDT_LOOP_ACCOUNT_ADDRESS:
      "0x522fff4c498a045af792aaf8d74fbad3a63f0ccd269068e661d526bc8a719275",
    NAVI_SUI_VSUI_LOOP_ACCOUNT_ADDRESS:
      "0xc2c0f74aa59b2cde7ccb3840c902e40dd09b87f3229e5e4d5f448436ee2d9097",
    NAVI_HASUI_SUI_LOOP_ACCOUNT_ADDRESS:
      "0x3d1c9fbaf2b70c1f7f15a903d08d6b5555b6a8a898d5e6abd1b9dbe8741290f9",
    NAVI_USDT_USDC_LOOP_ACCOUNT_ADDRESS: "",

    // Event-related Timestamps
    // format: module_event_start/end
    ALPHA_MODULE_DEPOSIT_EVENT_END_TIME: 1724074240881,
    NAVI_MODULE_LIQUIDITY_CHANGE_EVENT_START_TIME: 1724077830387,

    // AutoCompoundingEvent
    ALPHA_POOL_AUTO_COMPOUNDING_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphapool::RewardEvent",

    ALPHA_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",

    USDT_WUSDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::AutoCompoundingEvent",

    USDY_WUSDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::AutoCompoundingEvent",

    HASUI_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",

    WUSDC_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",

    WUSDC_WBTC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor_base_a::AutoCompoundingEvent",

    WETH_WUSDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::AutoCompoundingEvent",

    NAVX_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",

    BUCK_WUSDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::AutoCompoundingEvent",

    CETUS_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x1a22b26f139b34c9de9718cf7e53159b2b939ec8f46f4c040776b7a3d580dd28::alphafi_cetus_sui_investor::AutoCompoundingEvent",

    NAVI_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::AutoCompoundingEvent",

    NAVI_VSUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::AutoCompoundingEvent",

    NAVI_WETH_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::AutoCompoundingEvent",

    NAVI_USDT_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::AutoCompoundingEvent",

    NAVI_WUSDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::AutoCompoundingEvent",

    NAVI_HASUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::AutoCompoundingEvent",

    NAVI_LOOP_SUI_VSUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x531989a4be74dd43b25e7bb1eeade871f4524bdf437a8eaa30b4ac2a932b5579::alphafi_navi_sui_vsui_investor::AutoCompoundingEvent",

    NAVI_LOOP_USDC_USDT_POOL_AUTO_COMPOUNDING_EVENT:
      "0xad4f82d9956085bdab812d46fb2ea4d95c35e9e936cb53d04a79d3989ef97774::alphafi_navi_native_usdc_usdt_investor::AutoCompoundingEvent",

    ALPHA_WUSDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::AutoCompoundingEvent",
    WSOL_WUSDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::AutoCompoundingEvent",
    FUD_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",
    BLUB_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",
    SCA_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",

    NAVI_USDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::AutoCompoundingEvent",

    USDC_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",

    USDC_USDT_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor_base_a::AutoCompoundingEvent",

    ALPHA_USDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::AutoCompoundingEvent",

    USDC_WUSDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor_base_a::AutoCompoundingEvent",

    USDC_ETH_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor_base_a::AutoCompoundingEvent",

    DEEP_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",

    BUCK_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",

    BUCKET_BUCK_POOL_AUTO_COMPOUNDING_EVENT:
      "0xa095412a92ff0f063cbea962f2f88b1a93cbc85c72bebf5dd7d90a8e2d6375ae::alphafi_bucket_investor_v1::AutoCompoundingEvent",
    NAVI_USDY_POOL_AUTO_COMPOUNDING_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::AutoCompoundingEvent",
    NAVI_AUSD_POOL_AUTO_COMPOUNDING_EVENT:
      "0x5d90d17172b9e38da9f13a982668a9e48d0b0b5f864e421b60686f60758b37bd::alphafi_navi_investor_v2::AutoCompoundingEvent",
    NAVI_ETH_POOL_AUTO_COMPOUNDING_EVENT:
      "0x5d90d17172b9e38da9f13a982668a9e48d0b0b5f864e421b60686f60758b37bd::alphafi_navi_investor_v2::AutoCompoundingEvent",
    NAVI_LOOP_HASUI_SUI_POOL_AUTO_COMPOUNDING_EVENT:
      "0xb7039e74683423783f5179d6359df115af06b040bc439cbef3b307bdaceb050d::alphafi_navi_hasui_sui_investor::AutoCompoundingEvent",
    ALPHAFI_BLUEFIN_SUI_USDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_sui_first_investor::AutoCompoundingEvent",
    ALPHAFI_BLUEFIN_USDT_USDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_type_1_investor::AutoCompoundingEvent",
    NAVI_LOOP_USDT_USDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0xe516e0c12e56619c196fa0ee28d57e5e4ca532bd39df79bee9dcd1e3946119ec::alphafi_navi_usdt_usdc_investor::AutoCompoundingEvent",
    ALPHAFI_BLUEFIN_SUI_BUCK_POOL_AUTO_COMPOUNDING_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_sui_first_investor::AutoCompoundingEvent",
    ALPHAFI_BLUEFIN_AUSD_USDC_POOL_AUTO_COMPOUNDING_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_type_1_investor::AutoCompoundingEvent",
    NAVI_NS_POOL_AUTO_COMPOUNDING_EVENT:
      "0x5d90d17172b9e38da9f13a982668a9e48d0b0b5f864e421b60686f60758b37bd::alphafi_navi_investor_v2::AutoCompoundingEvent",

    //Rebalance Event Types

    ALPHA_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",

    USDT_WUSDC_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::RebalancePoolEvent",

    USDY_WUSDC_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::RebalancePoolEvent",

    HASUI_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",

    WUSDC_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",

    WUSDC_WBTC_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor_base_a::RebalancePoolEvent",

    WETH_WUSDC_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::RebalancePoolEvent",

    NAVX_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",

    BUCK_WUSDC_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::RebalancePoolEvent",

    CETUS_SUI_POOL_REBALANCE_EVENT:
      "0x1a22b26f139b34c9de9718cf7e53159b2b939ec8f46f4c040776b7a3d580dd28::alphafi_cetus_sui_investor::RebalancePoolEvent",

    NAVI_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::RebalancePoolEvent",

    ALPHA_WUSDC_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::RebalancePoolEvent",
    WSOL_WUSDC_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::RebalancePoolEvent",
    FUD_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",
    BLUB_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",
    SCA_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",

    USDC_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",

    USDC_USDT_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor_base_a::RebalancePoolEvent",

    ALPHA_USDC_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::RebalancePoolEvent",

    USDC_WUSDC_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor_base_a::RebalancePoolEvent",

    USDC_ETH_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor_base_a::RebalancePoolEvent",

    DEEP_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",

    BUCK_SUI_POOL_REBALANCE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::RebalancePoolEvent",

    BUCKET_BUCK_POOL_REBALANCE_EVENT: "",

    ALPHAFI_BLUEFIN_SUI_USDC_POOL_REBALANCE_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_sui_first_investor::RebalancePoolEvent",

    ALPHAFI_BLUEFIN_USDT_USDC_POOL_REBALANCE_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_type_1_investor::RebalancePoolEvent",

    ALPHAFI_BLUEFIN_SUI_BUCK_POOL_REBALANCE_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_sui_first_investor::RebalancePoolEvent",

    ALPHAFI_BLUEFIN_AUSD_USDC_POOL_REBALANCE_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_type_1_investor::RebalancePoolEvent",

    //Liquidity Change Event Types
    ALPHA_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphapool::LiquidityChangeEvent",

    ALPHA_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_pool::LiquidityChangeEvent",

    USDT_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_pool::LiquidityChangeEvent",

    USDY_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_pool::LiquidityChangeEvent",

    HASUI_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_pool::LiquidityChangeEvent",

    WUSDC_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_pool::LiquidityChangeEvent",

    WUSDC_WBTC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_pool_base_a::LiquidityChangeEvent",

    WETH_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_pool::LiquidityChangeEvent",

    NAVX_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_pool::LiquidityChangeEvent",

    BUCK_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_pool::LiquidityChangeEvent",

    CETUS_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x1a22b26f139b34c9de9718cf7e53159b2b939ec8f46f4c040776b7a3d580dd28::alphafi_cetus_sui_pool::LiquidityChangeEvent",

    NAVI_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_pool::LiquidityChangeEvent",

    NAVI_VSUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_pool::LiquidityChangeEvent",

    NAVI_WETH_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_pool::LiquidityChangeEvent",

    NAVI_USDT_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_pool::LiquidityChangeEvent",

    NAVI_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_pool::LiquidityChangeEvent",

    NAVI_HASUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_pool::LiquidityChangeEvent",

    NAVI_LOOP_SUI_VSUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x531989a4be74dd43b25e7bb1eeade871f4524bdf437a8eaa30b4ac2a932b5579::alphafi_navi_sui_vsui_pool::LiquidityChangeNewNewEvent",

    NAVI_LOOP_USDC_USDT_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x596639cb12dc5731890063eea58cc631bd6608f49bd338da96181f4265bf8f18::alphafi_navi_native_usdc_usdt_pool::LiquidityChangeEvent",

    ALPHA_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::LiquidityChangeEvent",

    WSOL_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::LiquidityChangeEvent",

    FUD_SUI_POOL_LIQUIDITY_CHANGE_EVENT: "",

    BLUB_SUI_POOL_LIQUIDITY_CHANGE_EVENT: "",

    SCA_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::LiquidityChangeEvent",

    NAVI_USDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_pool::LiquidityChangeEvent",

    USDC_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_pool::LiquidityChangeEvent",

    USDC_USDT_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_pool_base_a::LiquidityChangeEvent",

    ALPHA_USDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::LiquidityChangeEvent",

    USDC_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_pool_base_a::LiquidityChangeEvent",

    USDC_ETH_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_pool_base_a::LiquidityChangeEvent",

    DEEP_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_pool::LiquidityChangeEvent",

    BUCK_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_pool::LiquidityChangeEvent",

    BUCKET_BUCK_POOL_LIQUIDITY_CHANGE_EVENT:
      "0xa095412a92ff0f063cbea962f2f88b1a93cbc85c72bebf5dd7d90a8e2d6375ae::alphafi_bucket_pool_v1::LiquidityChangeEvent",

    NAVI_USDY_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_pool::LiquidityChangeEvent",
    NAVI_AUSD_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x5d90d17172b9e38da9f13a982668a9e48d0b0b5f864e421b60686f60758b37bd::alphafi_navi_pool_v2::LiquidityChangeEvent",
    NAVI_ETH_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x5d90d17172b9e38da9f13a982668a9e48d0b0b5f864e421b60686f60758b37bd::alphafi_navi_pool_v2::LiquidityChangeEvent",
    NAVI_LOOP_HASUI_SUI_POOL_LIQUIDITY_CHANGE_EVENT:
      "0xb7039e74683423783f5179d6359df115af06b040bc439cbef3b307bdaceb050d::alphafi_navi_hasui_sui_pool::LiquidityChangeEvent",
    ALPHAFI_BLUEFIN_SUI_USDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_sui_first_pool::LiquidityChangeEvent",
    ALPHAFI_BLUEFIN_USDT_USDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_type_1_pool::LiquidityChangeEvent",
    NAVI_LOOP_USDT_USDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0xe516e0c12e56619c196fa0ee28d57e5e4ca532bd39df79bee9dcd1e3946119ec::alphafi_navi_usdt_usdc::LiquidityChangeEvent",

    ALPHAFI_BLUEFIN_SUI_BUCK_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_sui_first_pool::LiquidityChangeEvent",

    ALPHAFI_BLUEFIN_AUSD_USDC_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_type_1_pool::LiquidityChangeEvent",
    NAVI_NS_POOL_LIQUIDITY_CHANGE_EVENT:
      "0x5d90d17172b9e38da9f13a982668a9e48d0b0b5f864e421b60686f60758b37bd::alphafi_navi_pool_v2::LiquidityChangeEvent",

    // WithdrawV2 Events
    ALPHA_POOL_WITHDRAW_V2_EVENT:
      "0x904f7b5fc4064adc1a3d49b263abe683660ba766f78abd84a454c37c1f102218::alphapool::WithdrawEventV2",

    // After Transaction Event Types
    ALPHA_POOL_AFTER_TRANSACTION_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphapool::BeforeAndAfterEvent",

    ALPHA_SUI_POOL_AFTER_TRANSACTION_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::AfterTransactionEvent",

    USDT_WUSDC_POOL_AFTER_TRANSACTION_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::AfterTransactionEvent",

    USDY_WUSDC_POOL_AFTER_TRANSACTION_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::AfterTransactionEvent",

    HASUI_SUI_POOL_AFTER_TRANSACTION_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::AfterTransactionEvent",

    WUSDC_SUI_POOL_AFTER_TRANSACTION_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::AfterTransactionEvent",

    WUSDC_WBTC_POOL_AFTER_TRANSACTION_EVENT:
      "0x2793db7aa0e0209afc84f0adb1b258973cf1c9da55c35ee85c18f2ed4912bb6f::alphafi_cetus_pool_base_a::AfterTransactionEvent",

    WETH_WUSDC_POOL_AFTER_TRANSACTION_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::AfterTransactionEvent",

    NAVX_SUI_POOL_AFTER_TRANSACTION_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::AfterTransactionEvent",

    BUCK_WUSDC_POOL_AFTER_TRANSACTION_EVENT:
      "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::AfterTransactionEvent",

    NAVI_SUI_POOL_AFTER_TRANSACTION_EVENT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::AfterTransactionEvent",

    NAVI_VSUI_POOL_AFTER_TRANSACTION_EVENT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::AfterTransactionEvent",

    NAVI_WETH_POOL_AFTER_TRANSACTION_EVENT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::AfterTransactionEvent",

    NAVI_USDT_POOL_AFTER_TRANSACTION_EVENT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::AfterTransactionEvent",

    NAVI_WUSDC_POOL_AFTER_TRANSACTION_EVENT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::AfterTransactionEvent",

    NAVI_HASUI_POOL_AFTER_TRANSACTION_EVENT:
      "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::AfterTransactionEvent",

    // Cetus Events
    CETUS_ADD_LIQUIDITY_EVENT:
      "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::pool::AddLiquidityEvent",
    CETUS_REMOVE_LIQUIDITY_EVENT:
      "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::pool::RemoveLiquidityEvent",
    CETUS_COLLECT_FEE_EVENT:
      "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::pool::CollectFeeEvent",
    CETUS_COLLECT_REWARD_EVENT:
      "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::pool::CollectRewardEvent",
    CETUS_SWAP_EVENT:
      "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::pool::SwapEvent",

    // Navi Events
    NAVI_POOL_DEPOSIT_EVENT:
      "0xd899cf7d2b5db716bd2cf55599fb0d5ee38a3061e7b6bb6eebf73fa5bc4c81ca::pool::PoolDeposit",
    NAVI_POOL_WITHDRAW_EVENT:
      "0xd899cf7d2b5db716bd2cf55599fb0d5ee38a3061e7b6bb6eebf73fa5bc4c81ca::pool::PoolWithdraw",

    // Wallets

    AIRDROP_WALLET_ADDRESS:
      "0x6b3a7df97bcad34c277106fef70444fa26e2bfbcd711c9c26f824869a66bb70a",

    // BLUEFIN OBJECTS
    BLUEFIN_GLOBAL_CONFIG:
      "0x03db251ba509a8d5d8777b6338836082335d93eecbdd09a11e190a1cff51c352",
    BLUEFIN_SUI_USDC_POOL:
      "0x3b585786b13af1d8ea067ab37101b6513a05d2f90cfe60e8b1d9e1b46a63c4fa",
    BLUEFIN_USDT_USDC_POOL:
      "0x0321b68a0fca8c990710d26986ba433d06b351deba9384017cd6175f20466a8f",
    BLUEFIN_DEEP_SUI_POOL:
      "0x8a37164afb2474185d182c7119e878f5b4a669d20d39d14b315506d4fdc350bd",
    BLUEFIN_SUI_BUCK_POOL:
      "0xe63329f43a9474d421be85ff270bafc04667b811d215d4d4ee2512bcf2713896",
    BLUEFIN_AUSD_USDC_POOL:
      "0x881639630836b703aa3e04898f8a3740584859838d986619d0ee0f63a784c078",

    // constants for haedel

    HAEDEL_STAKING:
      "0x47b224762220393057ebf4f70501b6e657c3e56684737568439a04f80849b2ca",

    // Constants for Navi Protocol",

    NAVI_STORAGE:
      "0xbb4e2f4b6205c2e2a2db47aeb4f830796ec7c005f88537ee775986639bc442fe",

    NAVI_SUI_POOL:
      "0x96df0fce3c471489f4debaaa762cf960b3d97820bd1f3f025ff8190730e958c5",

    NAVI_VSUI_BORROW_POOL:
      "0x9790c2c272e15b6bf9b341eb531ef16bcc8ed2b20dfda25d060bf47f5dd88d01",

    NAVI_VSUI_POOL:
      "0x9790c2c272e15b6bf9b341eb531ef16bcc8ed2b20dfda25d060bf47f5dd88d01",

    NAVI_WETH_POOL:
      "0x71b9f6e822c48ce827bceadce82201d6a7559f7b0350ed1daa1dc2ba3ac41b56",

    NAVI_WUSDC_POOL:
      "0xa02a98f9c88db51c6f5efaaf2261c81f34dd56d86073387e0ef1805ca22e39c8",

    NAVI_USDC_POOL:
      "0xa3582097b4c57630046c0c49a88bfc6b202a3ec0a9db5597c31765f7563755a8",

    NAVI_USDY_POOL:
      "0x4b6253a9f8cf7f5d31e6d04aed4046b9e325a1681d34e0eff11a8441525d4563",
    NAVI_AUSD_POOL:
      "0xc9208c1e75f990b2c814fa3a45f1bf0e85bb78404cfdb2ae6bb97de58bb30932",
    NAVI_ETH_POOL:
      "0x78ba01c21d8301be15690d3c30dc9f111871e38cfb0b2dd4b70cc6052fba41bb",

    NAVI_WUSDC_BORROW_POOL: "",

    NAVI_USDT_POOL:
      "0x0e060c3b5b8de00fb50511b7a45188c8e34b6995c01f69d98ea5a466fe10d103",

    NAVI_HASUI_POOL:
      "0x6fd9cb6ebd76bc80340a9443d72ea0ae282ee20e2fd7544f6ffcd2c070d9557a",

    NAVI_NS_POOL:
      "0x2fcc6245f72795fad50f17c20583f8c6e81426ab69d7d3590420571364d080d4",

    NAVI_USDT_BORROW_POOL: "",

    NAVI_INCENTIVE_V1:
      "0xaaf735bf83ff564e1b219a0d644de894ef5bdc4b2250b126b2a46dd002331821",

    NAVI_INCENTIVE_V2:
      "0xf87a8acb8b81d14307894d12595541a73f19933f88e1326d5be349c7a6f7559c",

    NAVI_VSUI_FUNDS_POOL:
      "0xe2b5ada45273676e0da8ae10f8fe079a7cec3d0f59187d3d20b1549c275b07ea",

    NAVI_NAVX_FUNDS_POOL:
      "0x9dae0cf104a193217904f88a48ce2cf0221e8cd9073878edd05101d6b771fa09",

    NAVI_NS_FUNDS_POOL:
      "0xbc14736bbe4ac59a4e3af6835a98765c15c5f7dbf9e7ba9b36679ce7ff00dc19",

    //constants for bucket

    BUCKET_PROTOCOL:
      "0x9e3dab13212b27f5434416939db5dec6a319d15b89a84fd074d03ece6350d3df",
    FOUNTAIN:
      "0xbdf91f558c2b61662e5839db600198eda66d502e4c10c4fc5c683f9caca13359",
    FLASK: "0xc6ecc9731e15d182bc0a46ebe1754a779a4bfb165c201102ad51a36838a1a7b8",

    // constants for kriya

    KRIYA_VSUI_SUI_POOL:
      "0xf1b6a7534027b83e9093bec35d66224daa75ea221d555c79b499f88c93ea58a9",

    KRIYA_VERSION:
      "0xf5145a7ac345ca8736cf8c76047d00d6d378f30e81be6f6eb557184d9de93c78",

    // constants for Scallop Protocol

    SCALLOP_VERSION:
      "0x07871c4b3c847a0f674510d4978d5cf6f960452795e8ff6f189fd2088a3f6ac7",

    SCALLOP_MARKET:
      "0xa757975255146dc9686aa823b7838b507f315d704f428cbadad2f4ea061939d9",

    SCALLOP_SUI_SPOOL:
      "0x69ce8e537e750a95381e6040794afa5ab1758353a1a2e1de7760391b01f91670",

    SCALLOP_SUI_REWARDS_POOL:
      "0xbca914adce058ad0902c7f3cfcd698392a475f00dcfdc3f76001d0370b98777a",

    SCALLOP_WUSDC_SPOOL:
      "0x4ace6648ddc64e646ba47a957c562c32c9599b3bba8f5ac1aadb2ae23a2f8ca0",

    SCALLOP_WUSDC_REWARDS_POOL:
      "0xf4268cc9b9413b9bfe09e8966b8de650494c9e5784bf0930759cfef4904daff8",

    SCALLOP_USDT_SPOOL:
      "0xcb328f7ffa7f9342ed85af3fdb2f22919e1a06dfb2f713c04c73543870d7548f",

    SCALLOP_USDT_REWARDS_POOL:
      "0x2c9f934d67a5baa586ceec2cc24163a2f049a6af3d5ba36b84d8ac40f25c4080",

    //Hop Contants

    HOP_QUERY_WALLET:
      "0x4260738f0f7341adc79a8edaa62f8a4681ebd27c595aecab1f322f47bfc52c5e", // used only for querying Hop for quote.

    HOP_FEE_BPS: 0,

    HOP_NETWORK: "mainnet",
  },
};

export const getConf = () => {
  return conf[CONF_ENV];
};
