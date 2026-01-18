import TrapNum1 from "@/components/game/traps/map2/TrapNum1.vue";
import TrapNum2 from "@/components/game/traps/map2/TrapNum2.vue";
import TrapNum3 from "@/components/game/traps/map2/TrapNum3.vue";
import TrapNum4 from "@/components/game/traps/map2/TrapNum4.vue";
import TrapNum5 from "@/components/game/traps/map2/TrapNum5.vue";
import TrapNum6 from "@/components/game/traps/map2/TrapNum6.vue";
import TrapNum7 from "@/components/game/traps/map2/TrapNum7.vue";
import TrapNum8 from "@/components/game/traps/map2/TrapNum8.vue";
import TrapNum9 from "@/components/game/traps/map2/TrapNum9.vue";
import TrapNum10 from "@/components/game/traps/map2/TrapNum10.vue";

export const TRAPS_BY_MAP = {
  map2: [
    {
      id: "trap1",
      name: "gas-trap",
      component: TrapNum1,
      cooldown: 5000,
    },
    {
      id: "trap2",
      name: "falling-rocks",
      component: TrapNum2,
      cooldown: 5000,
    },
    {
      id: "trap3",
      name: "water-poisoned",
      component: TrapNum3,
      cooldown: 5000,
    },
    {
      id: "trap4",
      name: "rock",
      component: TrapNum4,
      cooldown: 7000,
    },
    {
      id: "trap5",
      name: "falling-rocks-2",
      component: TrapNum5,
      cooldown: 5000,
    },
    {
      id: "trap6",
      name: "rope_trap",
      component: TrapNum6,
      cooldown: 6000,
    },
    {
      id: "trap7",
      name: "geyser",
      component: TrapNum7,
      cooldown: 5000,
    },
    {
      id: "trap8",
      name: "board-4(trap)",
      component: TrapNum8,
      cooldown: 8000,
    },
    {
      id: "trap9",
      name: "water-flow",
      component: TrapNum9,
      cooldown: 5000,
    },
    {
      id: "trap10",
      name: "water-with-fish",
      component: TrapNum10,
      cooldown: 5000,
    },
  ],

  map1: [
    // пример на будущее
    // {
    //   id: "trapA",
    //   name: "Spike Trap",
    //   component: TrapA,
    //   cooldown: 4000,
    // },
  ],
};
