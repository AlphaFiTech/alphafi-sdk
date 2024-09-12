import { TransactionFilter } from "@mysten/sui/dist/cjs/client";
import { conf, CONF_ENV } from "../../common/constants";

export const nonAlphaDepositFilters: TransactionFilter[] = (function () {
  const alphafi_cetus_pool_1filters = conf[CONF_ENV].ALPHA_PACKAGE_IDS.map(
    (id) => {
      return {
        MoveFunction: {
          function: "user_deposit",
          module: "alphafi_cetus_pool",
          package: id,
        },
      };
    },
  );
  const alphafi_cetus_pool_2filters = conf[CONF_ENV].ALPHA_2_PACKAGE_IDS.map(
    (id) => {
      return {
        MoveFunction: {
          function: "user_deposit",
          module: "alphafi_cetus_pool",
          package: id,
        },
      };
    },
  );
  const alphafi_cetus_sui_pool_1filters = conf[CONF_ENV].ALPHA_PACKAGE_IDS.map(
    (id) => {
      return {
        MoveFunction: {
          function: "user_deposit",
          module: "alphafi_cetus_sui_pool",
          package: id,
        },
      };
    },
  );
  const alphafi_cetus_sui_pool_2filters = conf[
    CONF_ENV
  ].ALPHA_2_PACKAGE_IDS.map((id) => {
    return {
      MoveFunction: {
        function: "user_deposit",
        module: "alphafi_cetus_sui_pool",
        package: id,
      },
    };
  });
  const alphafi_cetus_pool_base_a_1filters = conf[
    CONF_ENV
  ].ALPHA_PACKAGE_IDS.map((id) => {
    return {
      MoveFunction: {
        function: "user_deposit",
        module: "alphafi_cetus_pool_base_a",
        package: id,
      },
    };
  });
  const alphafi_cetus_pool_base_a_2filters = conf[
    CONF_ENV
  ].ALPHA_2_PACKAGE_IDS.map((id) => {
    return {
      MoveFunction: {
        function: "user_deposit",
        module: "alphafi_cetus_pool_base_a",
        package: id,
      },
    };
  });
  return [
    ...alphafi_cetus_pool_1filters,
    ...alphafi_cetus_pool_2filters,
    ...alphafi_cetus_sui_pool_1filters,
    ...alphafi_cetus_sui_pool_2filters,
    ...alphafi_cetus_pool_base_a_1filters,
    ...alphafi_cetus_pool_base_a_2filters,
  ] as TransactionFilter[];
})();

export const alphaDepositFilters: TransactionFilter[] = (function () {
  const alpha1filters = conf[CONF_ENV].ALPHA_PACKAGE_IDS.map((id) => {
    return {
      MoveFunction: {
        function: "user_deposit",
        module: "alphapool",
        package: id,
      },
    };
  });
  const alpha2fliters = conf[CONF_ENV].ALPHA_2_PACKAGE_IDS.map((id) => {
    return {
      MoveFunction: {
        function: "user_deposit",
        module: "alphapool",
        package: id,
      },
    };
  });
  return [...alpha1filters, ...alpha2fliters] as TransactionFilter[];
})();
