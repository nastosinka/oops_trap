import TrapNum3 from "@/components/game/traps/map2/TrapNum3.vue";
import TrapNum4 from "@/components/game/traps/map2/TrapNum4.vue";
import TrapNum6 from "@/components/game/traps/map2/TrapNum6.vue";
import TrapNum8 from "@/components/game/traps/map2/TrapNum8.vue";

export const TRAPS_BY_MAP = {
  map2: [
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
      id: "trap6",
      name: "Trap 6",
      component: TrapNum6,
      cooldown: 6000,
    },
    {
      id: "trap8",
      name: "Trap 8",
      component: TrapNum8,
      cooldown: 8000,
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
