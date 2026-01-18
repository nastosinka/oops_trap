import TrapNum1_2 from "@/components/game/traps/map2/TrapNum1.vue";
import TrapNum2_2 from "@/components/game/traps/map2/TrapNum2.vue";
import TrapNum3_2 from "@/components/game/traps/map2/TrapNum3.vue";
import TrapNum4_2 from "@/components/game/traps/map2/TrapNum4.vue";
import TrapNum5_2 from "@/components/game/traps/map2/TrapNum5.vue";
import TrapNum6_2 from "@/components/game/traps/map2/TrapNum6.vue";
import TrapNum7_2 from "@/components/game/traps/map2/TrapNum7.vue";
import TrapNum8_2 from "@/components/game/traps/map2/TrapNum8.vue";
import TrapNum9_2 from "@/components/game/traps/map2/TrapNum9.vue";
import TrapNum10_2 from "@/components/game/traps/map2/TrapNum10.vue";

import TrapNum1_1 from "@/components/game/traps/map1/TrapNum1.vue";
import TrapNum2_1_1 from "@/components/game/traps/map1/TrapNum2_1.vue";
import TrapNum2_2_1 from "@/components/game/traps/map1/TrapNum2_2.vue";
import TrapNum5_1_1 from "@/components/game/traps/map1/TrapNum5_1.vue";
import TrapNum5_2_1 from "@/components/game/traps/map1/TrapNum5_2.vue";
import TrapNum6_1 from "@/components/game/traps/map1/TrapNum6.vue";
import TrapNum7_1 from "@/components/game/traps/map1/TrapNum7.vue";
import TrapNum8_1_1 from "@/components/game/traps/map1/TrapNum8_1.vue";
import TrapNum8_2_1 from "@/components/game/traps/map1/TrapNum8_2.vue";

export const TRAPS_BY_MAP = {
  map2: [
    {
      id: "trap1",
      name: "gas-trap",
      component: TrapNum1_2,
    },
    {
      id: "trap2",
      name: "falling-rocks",
      component: TrapNum2_2,
    },
    {
      id: "trap3",
      name: "water-poisoned",
      component: TrapNum3_2,
    },
    {
      id: "trap4",
      name: "rock",
      component: TrapNum4_2,
    },
    {
      id: "trap5",
      name: "falling-rocks-2",
      component: TrapNum5_2,
    },
    {
      id: "trap6",
      name: "rope",
      component: TrapNum6_2,
    },
    {
      id: "trap7",
      name: "geyser",
      component: TrapNum7_2,
    },
    {
      id: "trap8",
      name: "board-4(trap)",
      component: TrapNum8_2,
    },
    {
      id: "trap9",
      name: "water-flow",
      component: TrapNum9_2,
    },
    {
      id: "trap10",
      name: "water-with-fish",
      component: TrapNum10_2,
    },
  ],

  map1: [
    {
      id: "trap1",
      name: "fish",
      component: TrapNum1_1,
    },
    {
      id: "trap2_1",
      name: "stone-break-1",
      component: TrapNum2_1_1,
    },
    {
      id: "trap2_2",
      name: "stone-break-2",
      component: TrapNum2_2_1,
    },
    {
      id: "trap5_1",
      name: "tablet-4",
      component: TrapNum5_1_1,
    },
    {
      id: "trap5_2",
      name: "tablet-5",
      component: TrapNum5_2_1,
    },
    // {
    //   id: "trap6",
    //   name: "stone down",
    //   component: TrapNum6_1,
    // },
    // {
    //   id: "trap7",
    //   name: "stone",
    //   component: TrapNum7_1,
    // },
    {
      id: "trap8_1",
      name: "pit-1",
      component: TrapNum8_1_1,
    },
    {
      id: "trap8_2",
      name: "pit-2",
      component: TrapNum8_2_1,
    },
  ],
};
