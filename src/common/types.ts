import BN from "bn.js";
import { conf, CONF_ENV } from "./constants.js";

export type SuiNetwork = "mainnet" | "testnet" | "devnet" | "localnet";

export type PoolName = SingleAssetPoolNames | DoubleAssetPoolNames;

export type SingleAssetPoolNames =
  | "ALPHA"
  | "NAVI-SUI"
  | "NAVI-VSUI"
  | "NAVI-WETH"
  | "NAVI-USDT"
  | "NAVI-WUSDC"
  | "NAVI-HASUI"
  | "NAVI-USDC"
  | "BUCKET-BUCK"
  | "NAVI-USDY"
  | "NAVI-AUSD"
  | "NAVI-ETH"
  | "NAVI-NS"
  | "NAVI-NAVX"
  | "NAVI-STSUI"
  | "NAVI-SUIBTC"
  | "NAVI-SUIUSDT"
  | "NAVI-DEEP"
  | "NAVI-WAL"
  | "ALPHALEND-SLUSH-SUI"
  | "ALPHALEND-SLUSH-WAL"
  | "ALPHALEND-SLUSH-USDC"
  | "ALPHALEND-SLUSH-DEEP"
  | LoopingPoolNames;

export type LoopingPoolNames =
  | "NAVI-LOOP-HASUI-SUI"
  | "NAVI-LOOP-USDT-USDC"
  | "NAVI-LOOP-SUI-VSUI"
  | "NAVI-LOOP-USDC-USDT"
  | "ALPHALEND-LOOP-SUI-STSUI"
  | "ALPHALEND-SINGLE-LOOP-TBTC"
  | "ALPHALEND-SINGLE-LOOP-SUIBTC"
  | "ALPHALEND-SINGLE-LOOP-XAUM"
  | "ALPHALEND-SINGLE-LOOP-WBTC"
  | "ALPHALEND-SINGLE-LOOP-DEEP"
  | "ALPHALEND-SINGLE-LOOP-WAL";

export type DoubleAssetPoolNames =
  | "HASUI-SUI"
  | "USDY-WUSDC"
  | "ALPHA-SUI"
  | "ALPHA-WUSDC"
  | "USDT-WUSDC"
  | "WUSDC-SUI"
  | "WUSDC-WBTC"
  | "WETH-WUSDC"
  | "NAVX-SUI"
  | "BUCK-WUSDC"
  | "CETUS-SUI"
  | "WSOL-WUSDC"
  | "FUD-SUI"
  | "BLUB-SUI"
  | "SCA-SUI"
  | "USDC-SUI"
  | "USDC-USDT"
  | "ALPHA-USDC"
  | "USDC-WUSDC"
  | "USDC-ETH"
  | "DEEP-SUI"
  | "BUCK-SUI"
  | "BLUEFIN-SUI-USDC"
  | "BLUEFIN-USDT-USDC"
  | "BLUEFIN-SUI-BUCK"
  | "BLUEFIN-AUSD-USDC"
  | "BLUEFIN-SUI-AUSD"
  | "BLUEFIN-ALPHA-USDC"
  | "BLUEFIN-WBTC-USDC"
  | "BLUEFIN-NAVX-VSUI"
  | "BLUEFIN-BLUE-SUI"
  | "BLUEFIN-BLUE-USDC"
  | "BLUEFIN-SEND-USDC"
  | "BLUEFIN-WBTC-SUI"
  | "BLUEFIN-DEEP-SUI"
  | "BLUEFIN-STSUI-SUI"
  | "BLUEFIN-STSUI-USDC"
  | "BLUEFIN-STSUI-ETH"
  | "BLUEFIN-STSUI-WSOL"
  | "BLUEFIN-ALPHA-STSUI"
  | "BLUEFIN-SUIUSDT-USDC"
  | "BLUEFIN-STSUI-BUCK"
  | "BLUEFIN-STSUI-MUSD"
  | "BLUEFIN-FUNGIBLE-STSUI-SUI"
  | "BLUEFIN-SUIBTC-USDC"
  | "BLUEFIN-LBTC-SUIBTC"
  | "USDC-SUIUSDT"
  | "BLUEFIN-WAL-USDC"
  | "BLUEFIN-WAL-STSUI"
  | "BLUEFIN-LYF-STSUI-SUI"
  | AutoBalancePoolNames;

export type AutoBalancePoolNames =
  | "BLUEFIN-AUTOBALANCE-USDT-USDC"
  | "BLUEFIN-AUTOBALANCE-SUI-USDC"
  | "BLUEFIN-AUTOBALANCE-SUIUSDT-USDC"
  | "BLUEFIN-AUTOBALANCE-DEEP-BLUE"
  | "BLUEFIN-AUTOBALANCE-DEEP-SUI"
  | "BLUEFIN-AUTOBALANCE-BLUE-SUI"
  | "BLUEFIN-AUTOBALANCE-SUI-LBTC"
  | "BLUEFIN-AUTOBALANCE-WAL-USDC"
  | "BLUEFIN-AUTOBALANCE-SUIUSDT-USDC-ZERO-ZERO"
  | "BLUEFIN-AUTOBALANCE-DEEP-SUI-175"
  | "BLUEFIN-AUTOBALANCE-SUI-USDC-175"
  | "BLUEFIN-AUTOBALANCE-WAL-SUI"
  | "BLUEFIN-AUTOBALANCE-XBTC-SUIBTC";

export type CoinName =
  | "ALPHA"
  | "SUI"
  | "WUSDC"
  | "USDC"
  | "USDT"
  | "VSUI"
  | "NAVX"
  | "SCA"
  | "CETUS"
  | "AFSUI"
  | "WETH"
  | "APT"
  | "WSOL"
  | "SLP"
  | "WBTC"
  | "CELO"
  | "TURBOS"
  | "HASUI"
  | "USDY"
  | "BUCK"
  | "FUD"
  | "BLUB"
  | "ETH"
  | "DEEP"
  | "AUSD"
  | "NS"
  | "BLUE"
  | "SEND"
  | "STSUI"
  | "SUIUSDT"
  | "MUSD"
  | "FT_BLUEFIN_STSUI_SUI"
  | "AlphaFi stSUI-SUI LP"
  | "SUIBTC"
  | "LBTC"
  | "WAL"
  | "DMC"
  | "TBTC"
  | "IKA"
  | "XBTC"
  | "ALKIMI"
  | "XAUM"
  | "UP"
  | "ESUI"
  | "EBTC"
  | "EGUSDC"
  | "ETHIRD"
  | "EXBTC"
  | "SDEUSD"
  | "EWAL"
  | "WBTC-LayerZero";

export type StrategyType =
  | "LOOPING"
  | "STABLE"
  | "STAKING"
  | "LIQUIDITY-POOL"
  | "LENDING"
  | "LIQUID-STAKING"
  | "AUTOBALANCE-LIQUIDITY-POOL"
  | "SINGLE-LOOPING"
  | "LEVERAGE-YIELD-FARMING";

/**
 * Represents a coin with its name, type, icon, and exponent.
 */
export interface Coin {
  /**
   * The name of the coin (e.g., SUI, ALPHA, WUSDC, USDT).
   */
  name: CoinName;

  /**
   * The type of the coin object on the Sui blockchain.
   */
  type: CoinType;

  /**
   * The icon or logo associated with the coin.
   */
  icon: Icon;

  /**
   * The exponent used to scale the coin's value.
   * Typically used to convert between the smallest unit and the base unit.
   * For example, SUI has an exponent of 9 because 1 SUI equals 10^9 MISTs.
   */
  expo: number;
}

export type Icon =
  | "https://coinmeta.polymedia.app/img/coins/0x0000000000000000000000000000000000000000000000000000000000000002-sui-SUI.svg"
  | "https://coinmeta.polymedia.app/img/coins/0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf-coin-COIN.webp"
  | "https://coinmeta.polymedia.app/img/coins/0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c-coin-COIN.webp"
  | "https://coinmeta.polymedia.app/img/coins/0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55-cert-CERT.webp"
  | "https://coinmeta.polymedia.app/img/coins/0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5-navx-NAVX.webp"
  | "https://suivision.xyz/images/coin-default.png"
  | "https://coinmeta.polymedia.app/img/coins/0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6-sca-SCA.webp"
  | "https://coinmeta.polymedia.app/img/coins/0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc-afsui-AFSUI.webp"
  | "https://coinmeta.polymedia.app/img/coins/0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5-coin-COIN.webp"
  | "https://coinmeta.polymedia.app/img/coins/0x3a5143bb1196e3bcdfab6203d1683ae29edd26294fc8bfeafe4aaa9d2704df37-coin-COIN.webp"
  | "https://coinmeta.polymedia.app/img/coins/0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8-coin-COIN.webp"
  | "https://coinmeta.polymedia.app/img/coins/0xc44d97a4bc4e5a33ca847b72b123172c88a6328196b71414f32c3070233604b2-slp-SLP.webp"
  | "https://coinmeta.polymedia.app/img/coins/0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881-coin-COIN.webp"
  | "https://coinmeta.polymedia.app/img/coins/0xa198f3be41cda8c07b3bf3fee02263526e535d682499806979a111e88a5a8d0f-coin-COIN.webp"
  | "https://coinmeta.polymedia.app/img/coins/0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b-cetus-CETUS.webp"
  | "https://coinmeta.polymedia.app/img/coins/0x5d1f47ea69bb0de31c313d7acf89b890dbb8991ea8e03c6c355171f84bb1ba4a-turbos-TURBOS.svg"
  | "https://7taj6jfau6n3dri7agspzfnva7qbj5sizz5xc3lb56nmxpsyoiba.arweave.net/_MCfJKCnm7HFHwGk_JW1B-AU9kjOe3FtYe-ay75YcgI"
  | "https://coinmeta.polymedia.app/img/coins/0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d-hasui-HASUI.svg"
  | "https://coinmeta.polymedia.app/img/coins/0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb-usdy-USDY.svg"
  | "https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/buck.svg/public"
  | "";

export type CoinType =
  | "0xfe3afec26c59e874f3c1d60b8203cb3852d2bb2aa415df9548b8d688e6683f93::alpha::ALPHA"
  | "0x2::sui::SUI"
  | "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
  | "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT"
  | "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN"
  | "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN"
  | "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX"
  | "0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA"
  | "0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc::afsui::AFSUI"
  | "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN"
  | "0x3a5143bb1196e3bcdfab6203d1683ae29edd26294fc8bfeafe4aaa9d2704df37::coin::COIN"
  | "0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN"
  | "0xc44d97a4bc4e5a33ca847b72b123172c88a6328196b71414f32c3070233604b2::slp::SLP"
  | "0x27792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN"
  | "0xa198f3be41cda8c07b3bf3fee02263526e535d682499806979a111e88a5a8d0f::coin::COIN"
  | "0x6864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS"
  | "0x5d1f47ea69bb0de31c313d7acf89b890dbb8991ea8e03c6c355171f84bb1ba4a::turbos::TURBOS"
  | "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI"
  | "0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY"
  | "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK"
  | "0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1::fud::FUD"
  | "0xfa7ac3951fdca92c5200d468d31a365eb03b2be9936fde615e69f0c1274ad3a0::BLUB::BLUB"
  | "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC"
  | "0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29::eth::ETH"
  | "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP"
  | "0x2053d08c1e2bd02791056171aab0fd12bd7cd7efad2ab8f6b9c8902f14df2ff2::ausd::AUSD"
  | "0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS"
  | "0xe1b45a0e641b9955a20aa0ad1c1f4ad86aad8afb07296d4085e349a50e90bdca::blue::BLUE"
  | "0xb45fcfcc2cc07ce0702cc2d229621e046c906ef14d9b25e8e4d25f6e8763fef7::send::SEND"
  | "0xd1b72982e40348d069bb1ff701e634c117bb5f741f44dff91e472d3b01461e55::stsui::STSUI"
  | "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT"
  | "0xe44df51c0b21a27ab915fa1fe2ca610cd3eaa6d9666fe5e62b988bf7f0bd8722::musd::MUSD"
  | "0xcd8f8a6fcd309e6d00f6f8f2d37eeeedeee7ccb50934d457e5a0a2f3e65bdbd2::ft_bluefin_stsui_sui::FT_BLUEFIN_STSUI_SUI"
  | "0xaafb102dd0902f5055cadecd687fb5b71ca82ef0e0285d90afde828ec58ca96b::btc::BTC"
  | "0x96eb2012a75798ce4410392baeab9dd888bc704799b7daa468c36856c83174f3::ALPHAFI_STSUI_SUI_LP::ALPHAFI_STSUI_SUI_LP"
  | "0x3e8e9423d80e1774a7ca128fccd8bf5f1f7753be658c5e645929037f7c819040::lbtc::LBTC"
  | "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL"
  | "0x4c981f3ff786cdb9e514da897ab8a953647dae2ace9679e8358eec1e3e8871ac::dmc::DMC"
  | "0x77045f1b9f811a7a8fb9ebd085b5b0c55c5cb0d1520ff55f7037f89b5da9f5f1::TBTC::TBTC"
  | "0x7262fb2f7a3a14c888c438a3cd9b912469a58cf60f367352c46584262e8299aa::ika::IKA"
  | "0x876a4b7bce8aeaef60464c11f4026903e9afacab79b9b142686158aa86560b50::xbtc::XBTC"
  | "0x1a8f4bc33f8ef7fbc851f156857aa65d397a6a6fd27a7ac2ca717b51f2fd9489::alkimi::ALKIMI"
  | "0x9d297676e7a4b771ab023291377b2adfaa4938fb9080b8d12430e4b108b836a9::xaum::XAUM"
  | "0x87dfe1248a1dc4ce473bd9cb2937d66cdc6c30fee63f3fe0dbb55c7a09d35dec::up::UP"
  | "0x66629328922d609cf15af779719e248ae0e63fe0b9d9739623f763b33a9c97da::esui::ESUI"
  | "0x244b98d29bd0bba401c7cfdd89f017c51759dad615e15a872ddfe45af079bb1d::ebtc::EBTC"
  | "0x68532559a19101b58757012207d82328e75fde7a696d20a59e8307c1a7f42ad7::egusdc::EGUSDC"
  | "0x89b0d4407f17cc1b1294464f28e176e29816a40612f7a553313ea0a797a5f803::ethird::ETHIRD"
  | "0x56589f5381303a763a62e79ac118e5242f83652f4c5a9448af75162d8cb7140c::exbtc::EXBTC"
  | "0xf6b468748dced8435f4407d0ecb0457b921a2e89266a60862e36dbf243c71841::sdeusd::SDEUSD"
  | "0x8a398f65f8635be31c181632bf730aea25074505d70c77d9b287e7d4f063ef70::ewal::EWAL"
  | "0x0041f9f9344cac094454cd574e333c4fdb132d7bcc9379bcd4aab485b2a63942::wbtc::WBTC";

type ConfEnv = (typeof conf)[typeof CONF_ENV];
export type PoolReceipt = ConfEnv[
  | "ALPHA_SUI_POOL_RECEIPT"
  | "USDY_WUSDC_POOL_RECEIPT"
  | "USDT_WUSDC_POOL_RECEIPT"
  | "ALPHA_POOL_RECEIPT"
  | "HASUI_SUI_POOL_RECEIPT"
  | "WUSDC_SUI_POOL_RECEIPT"
  | "WUSDC_WBTC_POOL_RECEIPT"
  | "WETH_WUSDC_POOL_RECEIPT"
  | "NAVI_SUI_POOL_RECEIPT"
  | "NAVI_VSUI_POOL_RECEIPT"
  | "NAVX_SUI_POOL_RECEIPT"
  | "NAVI_WETH_POOL_RECEIPT"
  | "NAVI_USDT_POOL_RECEIPT"
  | "NAVI_WUSDC_POOL_RECEIPT"
  | "NAVI_USDC_POOL_RECEIPT"
  | "BUCKET_BUCK_POOL_RECEIPT"];

export interface PoolData {
  weight: number;
  lastUpdateTime?: number;
  pendingRewards?: string;
  imageUrl1?: string | undefined;
  imageUrl2?: string | undefined;
  lockIcon?: string | undefined;
  poolName: string;
}
export interface PoolWeightDistribution {
  coinType: string;
  totalWeight: number;
  data: PoolData[];
}

export type CoinAmounts = {
  coinA: BN;
  coinB: BN;
};

export type CetusInvestor = {
  content: {
    fields: {
      free_balance_a: string;
      free_balance_b: string;
      lower_tick: string;
      upper_tick: string;
    };
  };
};

export type BluefinInvestor = CetusInvestor;

export type NaviInvestor = {
  content: {
    fields: {
      safe_borrow_percentage: string;
      tokensDeposited: string;
      current_debt_to_supply_ratio: string;
    };
  };
};

export type AlphaLendInvestor = NaviInvestor & {
  content: {
    fields: {
      position_cap: {
        fields: {
          position_id: string;
        };
      };
    };
  };
};
export type BluefinLyfInvestor = BluefinInvestor &
  AlphaLendInvestor & {
    content: {
      fields: {
        cur_debt_a: number;
        cur_debt_b: number;
        current_debt_to_supply_ratio: {
          type: string;
          fields: {
            value: number;
          };
        };
      };
    };
  };
export type BucketInvestor = {
  content: {
    fields: {
      tokensDeposited: string;
      stake_proof: {
        type: string;
        fields: {
          stake_amount: string;
        };
      };
    };
  };
};

export type CommonInvestorFields = {
  objectId: string;
  version: string;
  digest: string;
  type: string;
  content: {
    dataType: string;
    type: string;
    hasPublicTransfer: boolean;
    fields: {
      id: {
        id: string;
      };
      performance_fee: string;
      performance_fee_max_cap: string;
    };
  };
};

export type Investor = (
  | CetusInvestor
  | NaviInvestor
  | BucketInvestor
  | BluefinInvestor
  | AlphaLendInvestor
  | BluefinLyfInvestor
) &
  CommonInvestorFields;

export type CetusPoolType = {
  objectId: string;
  version: string;
  digest: string;
  content: {
    dataType: string;
    type: string;
    hasPublicTransfer: boolean;
    fields: {
      xTokenSupply: string;
      tokensInvested: string;
      coin_a: string;
      coin_b: string;
      current_sqrt_price: string;
      current_tick_index: {
        fields: { bits: number };
        type: string;
      };
      fee_growth_global_a: string;
      fee_growth_global_b: string;
      fee_protocol_coin_a: string;
      fee_protocol_coin_b: string;
      fee_rate: string;
      id: { id: string };
      index: string;
      is_pause: boolean;
      liquidity: string;
      position_manager: {
        fields: {
          position_index: string;
          positions: {
            fields: {
              head: string;
              id: { id: string };
              size: string;
              tail: string;
            };
            type: string;
          };
          tick_spacing: number;
        };
        type: string;
      };
      // reward_manager: {};
      // tick_manager: {};
      tick_spacing: number;
      url: string;
    };
  };
};

export type BluefinPoolType = {
  objectId: string;
  version: string;
  digest: string;
  content: {
    dataType: string;
    type: string;
    hasPublicTransfer: boolean;
    fields: {
      coin_a: string;
      coin_b: string;
      current_sqrt_price: string;
      current_tick_index: {
        fields: { bits: number };
        type: string;
      };
      fee_growth_global_coin_a: string;
      fee_growth_global_coin_b: string;
      fee_rate: string;
      icon_url: string;
      id: { id: string };
      is_paused: boolean;
      liquidity: string;
      name: string;
      observation_manager: {
        fields: {
          observation_index: string;
          observation: [];
          observation_cardinality: string;
          observation_cardinality_next: string;
        };
        type: string;
      };
      position_index: string;
      protocol_fee_coin_a: string;
      protocol_fee_coin_b: string;
      protocol_fee_share: string;
      reward_infos: [
        {
          type: string;
          fields: {
            reward_coin_type: string;
          };
        },
      ];
      sequence_number: string;
      ticks_manager: {
        type: string;
        fields: { bitmap: []; tick_spacing: number; ticks: [] };
      };
    };
  };
};

export type AlphaReceipt = {
  lockedBalance: string;
  unlockedBalance: string;
  balance: string;
};

export type Receipt = {
  objectId: string;
  version: string;
  digest: string;
  content: {
    dataType: string;
    type: string;
    hasPublicTransfer: boolean;
    fields: {
      id: { id: string };
      image_url: string;
      last_acc_reward_per_xtoken: {
        type: string;
        fields: {
          contents: {
            type: string;
            fields: {
              value: string;
              key: {
                type: string;
                fields: {
                  name: string;
                };
              };
            };
          }[];
        };
      };
      locked_balance:
        | {
            type: string;
            fields: {
              head: string;
              id: { id: string };
              size: string;
              tail: string;
            };
          }
        | undefined;
      name: string;
      owner: string;
      pending_rewards: {
        type: string;
        fields: {
          contents: {
            fields: {
              key: {
                type: string;
                fields: {
                  name: string;
                };
              };
              value: string;
            };
            type: string;
          }[];
        };
      };
      pool_id: string;
      xTokenBalance: string;
      unlocked_xtokens: string | undefined;
    };
  };
};

export type PoolType = {
  objectId: string;
  version: string;
  digest: string;
  content: {
    dataType: string;
    type: string;
    hasPublicTransfer: boolean;
    fields: {
      id: { id: string };
      xTokenSupply: string;
      tokensInvested: string;
      investor?: Investor;
      // rewards: Bag,
      acc_rewards_per_xtoken: {
        type: string;
        fields: {
          contents: [
            {
              type: string;
              fields: {
                value: string;
                key: {
                  type: string;
                  fields: {
                    name: string;
                  };
                };
              };
            },
          ];
        };
      };
      locked_period_in_days: string;
      locking_start_day: string;
      alpha_bal: string;
      locked_balance_withdrawal_fee: string;
      deposit_fee: string;
      deposit_fee_max_cap: string;
      withdrawal_fee: string;
      withdraw_fee_max_cap: string;
      weight: string;
      alphaUnlockedPerSecond: string;
      treasury_cap: {
        type: string;
        fields: {
          id: {
            id: string;
          };
          total_supply: {
            type: string;
            fields: {
              value: string;
            };
          };
        };
      };
    };
  };
};

export type AlphaPoolType = {
  objectId: string;
  version: string;
  digest: string;
  content: {
    dataType: string;
    type: string;
    hasPublicTransfer: boolean;
    fields: {
      id: {
        id: string;
      };
      xTokenSupply: string;
      tokensInvested: string;
      unsupplied_balance: string;
      claimable_balance: string;
      positions: ObjectTable;
      recently_updated_alphafi_receipts: VecMap<
        string,
        {
          fields: {
            xtokens_to_add: string;
            xtokens_to_remove: string;
          };
          type: string;
        }
      >;
      withdraw_requests: VecMap<
        string,
        {
          fields: {
            total_amount_to_withdraw: string;
            leftover_amount: string;
          };
          type: string;
        }
      >;
      fee_collected: string;
      last_distribution_time: string;
      last_autocompound_time: string;
      locking_period: string;
      time_from_locking_period_for_unstaking_to_start: string;
      current_exchange_rate: {
        fields: {
          value: string;
        };
      };
      rewards: Bag;
      acc_rewards_per_xtoken: VecMap<
        {
          fields: {
            name: string;
          };
          type: string;
        },
        string
      >;
      total_distributed: VecMap<
        {
          fields: {
            name: string;
          };
          type: string;
        },
        string
      >;
      deposit_fee: string;
      deposit_fee_max_cap: string;
      withdrawal_fee: string;
      withdraw_fee_max_cap: string;
      fee_address: string;
      is_deposit_paused: boolean;
      is_withdraw_paused: boolean;
      alphafi_partner_cap: {
        type: string;
        fields: {
          id: {
            id: string;
          };
        };
      };
      additional_fields: Bag;
    };
  };
};

export type VecMap<K = any, V = any> = {
  fields: {
    contents: {
      fields: {
        key: K;
        value: V;
      };
      type: string;
    }[];
  };
  type: string;
};

export type Bag = {
  fields: {
    id: {
      id: string;
    };
    size?: string;
  };
  type: string;
};

export type ObjectTable = Bag;

export interface CoinPair {
  coinA: Coin;
  coinB: Coin;
}

export type SwapOptions = {
  pair: CoinPair;
  senderAddress: string;
  slippage: number;
} & ({ inAmount: BN; outAmount?: never } | { outAmount: BN; inAmount?: never });

export type CetusSwapOptions = SwapOptions;

export type TickSpacing = 2 | 10 | 60 | 200;

export type CreatePoolOptions = {
  tickSpacing: TickSpacing;
  initializePrice: number;
  imageUrl: string;
  coinNameA: CoinName;
  coinNameB: CoinName;
  amount: number;
  isAmountA: boolean;
};

export type AlphaFiSingleAssetVault = {
  poolId: string;
  poolName: PoolName;
  receiptName: string;
  receiptType: string;
  coinType: CoinType;
  coinName: CoinName;
};

export type AlphaFiDoubleAssetVault = {
  poolId: string;
  poolName: PoolName;
  receiptName: string;
  receiptType: string;
  coinTypeA: CoinType;
  coinTypeB: CoinType;
  coinNameA: CoinName;
  coinNameB: CoinName;
};

// Union type for both single and double asset vaults
export type AlphaFiVault = AlphaFiSingleAssetVault | AlphaFiDoubleAssetVault;

export type AlphaVaultBalance = {
  lockedAlphaCoins: string | null;
  lockedAlphaCoinsInUSD: string | null;
  unlockedAlphaCoins: string | null;
  unlockedAlphaCoinsInUSD: string | null;
  totalAlphaCoins: string | null;
  totalAlphaCoinsInUSD: string | null;
};

export type DoubleAssetVaultBalance = {
  coinA: string | null;
  coinB: string | null;
  valueInUSD: string | null;
};

export type SingleAssetVaultBalance = {
  coin: string | null;
  valueInUSD: string | null;
};

export type AlphaFiVaultBalance =
  | AlphaVaultBalance
  | SingleAssetVaultBalance
  | DoubleAssetVaultBalance;

export type LpBreakdownType = {
  coinA: string | null;
  coinAInUsd: string | null;
  coinB: string | null;
  coinBInUsd: string | null;
  liquidity: string | null;
};

export interface RebalanceHistoryType {
  timestamp: string;
  lower_tick: string;
  upper_tick: string;
  after_price: string;
  amount_a_before: string;
  amount_b_before: string;
  amount_a_after: string;
  amount_b_after: string;
}

export type TransactionBlockType = {
  digest: string;
  transaction: {
    data: {
      messageVersion: string;
      transaction: {
        kind: string;
        inputs: {
          type: string;
          valueType: string;
          value: number;
          objectId: string | undefined;
        }[];
        transactions: {
          MoveCall: {
            package: string;
            module: string;
            function: string;
            type_arguments: string[];
            arguments: string[];
          };
        }[];
      };
      sender: string;
    };
    txSignatures: string[];
  };
  events: {
    type: string;
    parsedJson: {
      after_sqrt_price: string;
    };
  }[];
  timestampMs: string;
  checkpoint: string;
};

export interface NaviVoloData {
  data: {
    operatorBalance: string;
    collectableFee: string;
    pendingStakes: string;
    poolTotalRewards: string;
    unstakeTicketSupply: string;
    totalStaked: string;
    activeStake: string;
    calcTotalRewards: string;
    currentEpoch: string;
    validators: object;
    exchangeRate: string;
    totalSupply: string;
    apy: string;
    sortedValidators: string[];
    maxInstantUnstake: string;
    maxNoFeeUnstake: string;
  };
  code: number;
}

export type LoopingDebt = {
  objectId: string;
  version: string;
  digest: string;
  content: {
    dataType: string;
    type: string;
    hasPublicTransfer: boolean;
    fields: {
      name: [];
      value: string;
    };
  };
};

export type Distributor = {
  objectId: string;
  version: string;
  digest: string;
  type: string;
  content: {
    dataType: string;
    type: string;
    hasPublicTransfer: boolean;
    fields: {
      airdrop_wallet: string;
      airdrop_wallet_balance: string;
      dust_wallet_address: string;
      fee_wallet: string;
      id: {
        id: string;
      };
      next_halving_timestamp: string;
      pool_allocator: Allocator;

      // to-do
      reward_unlock: {
        fields: { contents: [] };
        type: string;
      };
      start_timestamp: string;
      target: string;
      team_wallet_address: string;
      team_wallet_balance: string;
    };
  };
};

export type Allocator = {
  fields: {
    id: {
      id: string;
    };
    members: {
      fields: {
        contents: MemberType[];
      };
      type: string;
    };
    rewards: {
      fields: {
        id: {
          id: string;
        };
        size: string;
      };
      type: string;
    };
    total_weights: {
      fields: {
        contents: TotalWeightType[];
      };
      type: string;
    };
  };
  type: string;
};

export type TotalWeightType = {
  fields: {
    key: {
      fields: {
        name: string;
      };
      type: string;
    };
    value: string;
  };
  type: string;
};

export type MemberPoolDataType = {
  fields: {
    key: {
      fields: {
        name: string;
      };
      type: string;
    };
    value: {
      fields: {
        last_update_time: string;
        pending_rewards: string;
        weight: string;
      };
      type: string;
    };
  };
  type: string;
};

export type MemberType = {
  fields: {
    key: string;
    value: {
      fields: {
        pool_data: {
          fields: {
            contents: MemberPoolDataType[];
          };
          type: string;
        };
      };
      type: string;
    };
  };
  type: string;
};
