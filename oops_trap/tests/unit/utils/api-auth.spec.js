// apiFetch.test.js
import { describe, test, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "@/utils/api-auth.js";

vi.mock("@/components/base/VolumeControl.vue", () => ({
  default: {
    template: "<div class='volume-control-stub' />",
  },
}));

vi.unmock("@/utils/api-auth.js");

describe("apiFetch", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Мокаем fetch
    global.fetch = vi.fn();

    // Мокаем sessionStorage
    Object.defineProperty(window, "sessionStorage", {
      value: {
        removeItem: vi.fn(),
        getItem: vi.fn(),
        setItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    // Мокаем window.location
    delete window.location;
    window.location = { href: "" };

    // Сбрасываем все моки перед каждым тестом
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Восстанавливаем оригинальный location
    window.location = originalLocation;
  });

  test("должен вызывать fetch с правильными параметрами по умолчанию", async () => {
    const mockResponse = {
      status: 200,
      json: vi.fn().mockResolvedValue({ data: "test" }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const url = "https://api.example.com/data";
    await apiFetch(url);

    expect(fetch).toHaveBeenCalledWith(url, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  });

  test("должен объединять пользовательские headers с Content-Type", async () => {
    const mockResponse = {
      status: 200,
      json: vi.fn().mockResolvedValue({}),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const url = "https://api.example.com/data";
    const options = {
      headers: {
        Authorization: "Bearer token123",
        "X-Custom-Header": "value",
      },
    };

    await apiFetch(url, options);

    expect(fetch).toHaveBeenCalledWith(url, {
      headers: {
        Authorization: "Bearer token123",
        "X-Custom-Header": "value",
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  });

  test('должен передавать credentials: "include"', async () => {
    const mockResponse = {
      status: 200,
      json: vi.fn().mockResolvedValue({}),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const url = "https://api.example.com/data";
    await apiFetch(url);

    expect(fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        credentials: "include",
      })
    );
  });

  test("должен передавать другие опции из options", async () => {
    const mockResponse = {
      status: 200,
      json: vi.fn().mockResolvedValue({}),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const url = "https://api.example.com/data";
    const options = {
      method: "POST",
      body: JSON.stringify({ name: "test" }),
      mode: "cors",
    };

    await apiFetch(url, options);

    expect(fetch).toHaveBeenCalledWith(url, {
      method: "POST",
      body: JSON.stringify({ name: "test" }),
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  });

  test('должен удалять user из sessionStorage и перенаправлять на "/" при статусе 401', async () => {
    const mockResponse = {
      status: 401,
      json: vi.fn().mockResolvedValue({}),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const url = "https://api.example.com/data";

    // Используем mockImplementation чтобы избежать ошибки "navigation not implemented"
    const originalAssign = window.location.assign;
    window.location.assign = vi.fn();

    await apiFetch(url);

    expect(sessionStorage.removeItem).toHaveBeenCalledWith("user");
    expect(window.location.href).toBe("/");

    // Восстанавливаем оригинальный метод
    window.location.assign = originalAssign;
  });

  test("НЕ должен удалять user и перенаправлять при других статусах ошибки", async () => {
    const mockResponse = {
      status: 403,
      json: vi.fn().mockResolvedValue({}),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const url = "https://api.example.com/data";

    await apiFetch(url);

    expect(sessionStorage.removeItem).not.toHaveBeenCalled();
    expect(window.location.href).toBe("");
  });

  test("должен возвращать response объект", async () => {
    const mockResponse = {
      status: 200,
      statusText: "OK",
      json: vi.fn().mockResolvedValue({ data: "test" }),
      ok: true,
    };
    global.fetch.mockResolvedValue(mockResponse);

    const url = "https://api.example.com/data";
    const result = await apiFetch(url);

    expect(result).toBe(mockResponse);
  });

  test("должен обрабатывать сетевые ошибки", async () => {
    global.fetch.mockRejectedValue(new Error("Network error"));

    const url = "https://api.example.com/data";

    await expect(apiFetch(url)).rejects.toThrow("Network error");
    expect(sessionStorage.removeItem).not.toHaveBeenCalled();
    expect(window.location.href).toBe("");
  });

  test("должен корректно работать с пустыми options", async () => {
    const mockResponse = {
      status: 200,
      json: vi.fn().mockResolvedValue({}),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const url = "https://api.example.com/data";
    await apiFetch(url, {});

    expect(fetch).toHaveBeenCalledWith(url, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  });

  test("должен корректно работать с options без headers", async () => {
    const mockResponse = {
      status: 200,
      json: vi.fn().mockResolvedValue({}),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const url = "https://api.example.com/data";
    await apiFetch(url, { method: "GET" });

    expect(fetch).toHaveBeenCalledWith(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  });
});
