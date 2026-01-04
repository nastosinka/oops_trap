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
      name: "Trap 1",
      component: TrapNum1,
      cooldown: 5000,
    },
    {
      id: "trap2",
      name: "Trap 2",
      component: TrapNum2,
      cooldown: 5000,
    },
    {
      id: "trap3",
      name: "Trap 3",
      component: TrapNum3,
      cooldown: 5000,
    },
    {
      id: "trap4",
      name: "Trap 4",
      component: TrapNum4,
      cooldown: 7000,
    },
    {
      id: "trap5",
      name: "Trap 5",
      component: TrapNum5,
      cooldown: 5000,
    },
    {
      id: "trap6",
      name: "Trap 6",
      component: TrapNum6,
      cooldown: 6000,
    },
    {
      id: "trap7",
      name: "Trap 7",
      component: TrapNum7,
      cooldown: 5000,
    },
    {
      id: "trap8",
      name: "Trap 8",
      component: TrapNum8,
      cooldown: 8000,
    },
    {
      id: "trap9",
      name: "Trap 9",
      component: TrapNum9,
      cooldown: 5000,
    },
    {
      id: "trap10",
      name: "Trap 10",
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
