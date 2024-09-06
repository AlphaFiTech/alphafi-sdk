import BN from "bn.js";
import { conf, CONF_ENV } from "./constants";

export type SuiNetwork = "mainnet" | "testnet" | "devnet" | "localnet";

export type ParentProtocolName = "ALPHAFI" | "CETUS" | "NAVI";

export type PoolName =
  | "ALPHA"
  | "HASUI-SUI"
  | "USDY-USDC"
  | "ALPHA-SUI"
  | "USDT-USDC"
  | "USDC-SUI"
  | "USDC-WBTC"
  | "WETH-USDC"
  | "NAVI-SUI"
  | "NAVI-VSUI"
  | "NAVX-SUI"
  | "NAVI-WETH"
  | "NAVI-USDT"
  | "NAVI-USDC"
  | "BUCK-USDC"
  | "CETUS-SUI";

export type CoinName =
  | "ALPHA"
  | "SUI"
  | "USDC"
  | "USDT"
  | "VSUI"
  | "NAVX"
  | "SCA"
  | "CETUS"
  | "AFSUI"
  | "WETH"
  | "APT"
  | "SOL"
  | "SLP"
  | "WBTC"
  | "CELO"
  | "TURBOS"
  | "HASUI"
  | "USDY"
  | "BUCK";

/**
 * Represents a coin with its name, type, icon, and exponent.
 */
export interface Coin {
  /**
   * The name of the coin (e.g., SUI, ALPHA, USDC, USDT).
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
  | "https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/buck.svg/public";

export type CoinType =
  | "0xfe3afec26c59e874f3c1d60b8203cb3852d2bb2aa415df9548b8d688e6683f93::alpha::ALPHA"
  | "0x2::sui::SUI"
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
  | "0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN"
  | "0xa198f3be41cda8c07b3bf3fee02263526e535d682499806979a111e88a5a8d0f::coin::COIN"
  | "0x6864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS"
  | "0x5d1f47ea69bb0de31c313d7acf89b890dbb8991ea8e03c6c355171f84bb1ba4a::turbos::TURBOS"
  | "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI"
  | "0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY"
  | "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK";

const ALPHA_SUI_POOL_RECEIPT = conf[CONF_ENV].ALPHA_SUI_POOL_RECEIPT;
const USDY_USDC_POOL_RECEIPT = conf[CONF_ENV].USDY_USDC_POOL_RECEIPT;
const USDT_USDC_POOL_RECEIPT = conf[CONF_ENV].USDT_USDC_POOL_RECEIPT;
const ALPHA_POOL_RECEIPT = conf[CONF_ENV].ALPHA_POOL_RECEIPT;
const HASUI_SUI_POOL_RECEIPT = conf[CONF_ENV].HASUI_SUI_POOL_RECEIPT;
const USDC_SUI_POOL_RECEIPT = conf[CONF_ENV].USDC_SUI_POOL_RECEIPT;
const USDC_WBTC_POOL_RECEIPT = conf[CONF_ENV].USDC_WBTC_POOL_RECEIPT;
const WETH_USDC_POOL_RECEIPT = conf[CONF_ENV].WETH_USDC_POOL_RECEIPT;
const NAVI_SUI_POOL_RECEIPT = conf[CONF_ENV].NAVI_SUI_POOL_RECEIPT;
const NAVI_VSUI_POOL_RECEIPT = conf[CONF_ENV].NAVI_VSUI_POOL_RECEIPT;
const NAVX_SUI_POOL_RECEIPT = conf[CONF_ENV].NAVX_SUI_POOL_RECEIPT;
const NAVI_WETH_POOL_RECEIPT = conf[CONF_ENV].NAVI_WETH_POOL_RECEIPT;
const NAVI_USDT_POOL_RECEIPT = conf[CONF_ENV].NAVI_USDT_POOL_RECEIPT;
const NAVI_USDC_POOL_RECEIPT = conf[CONF_ENV].NAVI_USDC_POOL_RECEIPT;
export type PoolReceipt =
  | typeof ALPHA_SUI_POOL_RECEIPT
  | typeof USDY_USDC_POOL_RECEIPT
  | typeof USDT_USDC_POOL_RECEIPT
  | typeof ALPHA_POOL_RECEIPT
  | typeof HASUI_SUI_POOL_RECEIPT
  | typeof USDC_SUI_POOL_RECEIPT
  | typeof USDC_WBTC_POOL_RECEIPT
  | typeof WETH_USDC_POOL_RECEIPT
  | typeof NAVI_SUI_POOL_RECEIPT
  | typeof NAVI_VSUI_POOL_RECEIPT
  | typeof NAVX_SUI_POOL_RECEIPT
  | typeof NAVI_WETH_POOL_RECEIPT
  | typeof NAVI_USDT_POOL_RECEIPT
  | typeof NAVI_USDC_POOL_RECEIPT;

export type CoinAmounts = {
  coinA: BN;
  coinB: BN;
};

export type CetusInvestor = {
  objectId: string;
  version: string;
  digest: string;
  type: string;
  content: {
    dataType: string;
    type: string;
    hasPublicTransfer: boolean;
    fields: {
      free_balance_a: string;
      free_balance_b: string;
      id: {
        id: string;
      };
      lower_tick: string;
      performance_fee: string;
      performance_fee_max_cap: string;
      upper_tick: string;
    };
  };
};

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

export type AlphaReceipt = {
  lockedBalance: string;
  unlockedBalance: string;
  balance: string;
};

export type Receipt = {
  objectId: string;
  version: string;
  digest: string;
  type: string;
  content: {
    dataType: string;
    type: string;
    hasPublicTransfer: boolean;
    fields: {
      creator: string;
      id: { id: string };
      image_url: string;
      last_acc_reward_per_xtoken: {
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
      locked_balance: {
        type: string;
        fields: {
          head: string;
          id: { id: string };
          size: string;
          tail: string;
        };
      };
      name: string;
      owner: string;
      pending_rewards: {
        type: string;
        fields: {
          contents: [
            {
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
            },
          ];
        };
      };
      pool_id: string;
      xTokenBalance: string;
      unlocked_xtokens: string;
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
      // acc_rewards_per_xtoken: VecMap<TypeName,u256>,
      alpha_bal: string;
      deposit_fee: string;
      deposit_fee_max_cap: string;
      id: { id: string };
      // image_url: string;
      instant_withdraw_fee: string;
      instant_withdraw_fee_max_cap: string;
      locked_period_in_days: string;
      locking_start_day: string;
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
      // name: string;
      // rewards: Bag,
      tokensInvested: string;
      withdraw_fee_max_cap: string;
      withdrawal_fee: string;
      xTokenSupply: string;
    };
  };
};

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
