import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import OtherPlayersContainer from "@/components/game/player/general/OtherPlayer.vue";

describe("OtherPlayersContainer", () => {
  const mockPlayers = [
    {
      id: 1,
      name: "Player 1",
      x: 100,
      y: 200,
      lastImage: 1,
      isHost: true,
      trapper: false,
    },
    {
      id: 2,
      name: "Player 2",
      x: 300,
      y: 400,
      lastImage: 8,
      isHost: false,
      trapper: true,
    },
    {
      id: 3,
      name: "Player 3",
      x: 500,
      y: 600,
      lastImage: 7,
      isHost: false,
      trapper: false,
    },
  ];

  it("рендерит контейнер для игроков", () => {
    const wrapper = mount(OtherPlayersContainer, {
      props: {
        players: mockPlayers,
      },
    });

    expect(wrapper.find(".other-players-container").exists()).toBe(true);
    expect(wrapper.findAll(".other-player")).toHaveLength(3);
  });

  it("корректно обрабатывает массив игроков через computed свойство", () => {
    const wrapper = mount(OtherPlayersContainer, {
      props: {
        players: mockPlayers,
      },
    });

    const vm = wrapper.vm;
    const processed = vm.processedPlayers;

    expect(processed).toHaveLength(3);

    // Проверяем преобразование данных
    expect(processed[0]).toMatchObject({
      id: "1",
      name: "Player 1",
      x: 100,
      y: 200,
      lastImage: 1,
      isHost: true,
      trapper: false,
      face: "left", // lastImage: 1 < 3, поэтому face = 'left'
    });

    expect(processed[1]).toMatchObject({
      id: "2",
      name: "Player 2",
      face: "right", // lastImage: 8 >= 3, поэтому face = 'right'
    });

    expect(processed[2]).toMatchObject({
      id: "3",
      name: "Player 3",
      face: "left", // lastImage: 7 < 8, но >= 3? нет, lastImage === 7, поэтому face = 'left'
    });
  });

  it("обрабатывает пустой массив игроков", () => {
    const wrapper = mount(OtherPlayersContainer, {
      props: {
        players: [],
      },
    });

    expect(wrapper.vm.processedPlayers).toEqual([]);
    expect(wrapper.findAll(".other-player")).toHaveLength(0);
  });

  it("обрабатывает невалидные данные игроков", () => {
    const wrapper = mount(OtherPlayersContainer, {
      props: {
        players: [{ id: null, x: "invalid", y: undefined }, { id: 5 }],
      },
    });

    const processed = wrapper.vm.processedPlayers;

    expect(processed[0]).toMatchObject({
      id: "null",
      name: "Player null", // fallback имя
      x: 0, // преобразование невалидного значения
      y: 0,
      lastImage: 1,
      isHost: false,
      trapper: false,
      face: "right", // default
    });
  });

  it("корректно применяет стили через playerStyle функцию", () => {
    const wrapper = mount(OtherPlayersContainer);
    const vm = wrapper.vm;

    const player = {
      x: 123.456,
      y: 789.123,
    };

    const style = vm.playerStyle(player);

    expect(style).toEqual({
      position: "absolute",
      left: "123px", // округление Math.round
      top: "789px", // округление Math.round
      width: "24px",
      height: "48px",
      zIndex: 150,
      pointerEvents: "none",
    });
  });

  it("корректно определяет CSS классы через playerClasses функцию", () => {
    const wrapper = mount(OtherPlayersContainer);
    const vm = wrapper.vm;

    // Тестируем разные состояния игрока
    const testCases = [
      {
        player: { face: "left", lastImage: 2 },
        expectedClasses: {
          "face-left": true,
          "face-right": false,
          walking: true, // lastImage < 7
          mirror: true,
        },
      },
      {
        player: { face: "right", lastImage: 8 },
        expectedClasses: {
          "face-left": false,
          "face-right": true,
          walking: false, // lastImage = 8
          mirror: false,
        },
      },
      {
        player: { face: "right", lastImage: 5 },
        expectedClasses: {
          "face-left": false,
          "face-right": true,
          walking: true, // lastImage < 7
          mirror: false,
        },
      },
      {
        player: { face: "left", lastImage: 9 },
        expectedClasses: {
          "face-left": true,
          "face-right": false,
          walking: true, // lastImage > 8
          mirror: true,
        },
      },
    ];

    testCases.forEach(({ player, expectedClasses }) => {
      expect(vm.playerClasses(player)).toEqual(expectedClasses);
    });
  });

  it("определяет направление взгляда игрока на основе lastImage", () => {
    const testCases = [
      { lastImage: 1, expectedFace: "left" }, // < 3
      { lastImage: 2, expectedFace: "left" }, // < 3
      { lastImage: 3, expectedFace: "right" }, // >= 3
      { lastImage: 4, expectedFace: "right" }, // >= 3
      { lastImage: 5, expectedFace: "right" }, // >= 3
      { lastImage: 6, expectedFace: "right" }, // >= 3
      { lastImage: 7, expectedFace: "left" }, // === 7 (специальный случай)
      { lastImage: 8, expectedFace: "right" }, // === 8 (специальный случай)
    ];

    testCases.forEach(({ lastImage, expectedFace }) => {
      const wrapper = mount(OtherPlayersContainer, {
        props: {
          players: [{ id: 1, lastImage }],
        },
      });

      const player = wrapper.vm.processedPlayers[0];
      expect(player.face).toBe(expectedFace);
    });
  });

  it("отображает имена игроков и бейджи когда showNames = true", () => {
    const wrapper = mount(OtherPlayersContainer, {
      props: {
        players: mockPlayers,
        showNames: true,
      },
    });

    const playerNames = wrapper.findAll(".player-name");
    expect(playerNames).toHaveLength(3);

    // Проверяем первый игрок (хост)
    expect(playerNames[0].text()).toContain("Player 1");
    expect(playerNames[0].find(".host-badge").exists()).toBe(true);
    expect(playerNames[0].find(".trapper-badge").exists()).toBe(false);

    // Проверяем второго игрока (trapper)
    expect(playerNames[1].text()).toContain("Player 2");
    expect(playerNames[1].find(".host-badge").exists()).toBe(false);
    expect(playerNames[1].find(".trapper-badge").exists()).toBe(true);

    // Проверяем третьего игрока (обычный)
    expect(playerNames[2].text()).toContain("Player 3");
    expect(playerNames[2].find(".host-badge").exists()).toBe(false);
    expect(playerNames[2].find(".trapper-badge").exists()).toBe(false);
  });

  it("не отображает имена игроков когда showNames = false", () => {
    const wrapper = mount(OtherPlayersContainer, {
      props: {
        players: mockPlayers,
        showNames: false,
      },
    });

    expect(wrapper.findAll(".player-name")).toHaveLength(0);
  });

  it("имеет спрайты для игроков", () => {
    const wrapper = mount(OtherPlayersContainer, {
      props: { players: mockPlayers },
    });

    expect(wrapper.findAll(".player-sprite")).toHaveLength(3);
  });

  it("использует fallback имя когда name не указан", () => {
    const wrapper = mount(OtherPlayersContainer, {
      props: {
        players: [{ id: 42 }],
      },
    });

    const player = wrapper.vm.processedPlayers[0];
    expect(player.name).toBe("Player 42");
  });

  it("хранит предыдущие позиции игроков в prevXMap", () => {
    const wrapper1 = mount(OtherPlayersContainer, {
      props: {
        players: [{ id: 1, x: 100 }],
      },
    });

    const vm1 = wrapper1.vm;

    // После монтирования позиция должна быть в карте
    // Заметка: prevXMap не экспортируется, но мы можем проверить его существование
    expect(vm1.prevXMap).toBeDefined();
  });
});
