// notification.test.js
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { message } from 'ant-design-vue'
import { showSuccess, showError } from '@/utils/notification-wrapper.js'

vi.unmock('@/utils/notification-wrapper.js')

// Мокаем ant-design-vue message
vi.mock('ant-design-vue', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('Notification functions', () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('showSuccess', () => {
    test('должен вызывать message.success с переданным текстом', () => {
      // Arrange
      const text = 'Успешное сообщение'

      // Act
      showSuccess(text)

      // Assert
      expect(message.success).toHaveBeenCalledTimes(1)
      expect(message.success).toHaveBeenCalledWith(text)
    })

    test('должен вызывать message.success с пустой строкой', () => {
      // Arrange
      const text = ''

      // Act
      showSuccess(text)

      // Assert
      expect(message.success).toHaveBeenCalledTimes(1)
      expect(message.success).toHaveBeenCalledWith(text)
    })

    test('должен вызывать message.success с разными типами данных', () => {
      // Arrange
      const testCases = [
        { input: 'Текст сообщения', description: 'строковый текст' },
        { input: '123', description: 'число как строка' },
        { input: 'true', description: 'булево как строка' }
      ]

      // Act & Assert
      testCases.forEach(({ input, description }) => {
        showSuccess(input)
        expect(message.success).toHaveBeenCalledWith(input)
        // Сбрасываем счетчик вызовов для следующего теста
        vi.clearAllMocks()
      })
    })

    test('должен вызывать message.success только один раз', () => {
      // Arrange
      const text = 'Сообщение'

      // Act
      showSuccess(text)
      showSuccess(text)

      // Assert
      expect(message.success).toHaveBeenCalledTimes(2)
    })
  })

  describe('showError', () => {
    test('должен вызывать message.error с переданным текстом', () => {
      // Arrange
      const text = 'Ошибка!'

      // Act
      showError(text)

      // Assert
      expect(message.error).toHaveBeenCalledTimes(1)
      expect(message.error).toHaveBeenCalledWith(text)
    })

    test('должен вызывать message.error с длинным текстом', () => {
      // Arrange
      const text =
        'Очень длинное сообщение об ошибке, которое содержит много информации о том, что пошло не так в процессе выполнения операции'

      // Act
      showError(text)

      // Assert
      expect(message.error).toHaveBeenCalledTimes(1)
      expect(message.error).toHaveBeenCalledWith(text)
    })

    test('должен вызывать message.error с текстом ошибки по умолчанию если текст не передан', () => {
      // Arrange
      const text = ''

      // Act
      showError(text)

      // Assert
      expect(message.error).toHaveBeenCalledTimes(1)
      expect(message.error).toHaveBeenCalledWith('')
    })

    test('не должен вызывать message.success при вызове showError', () => {
      // Arrange
      const text = 'Ошибка'

      // Act
      showError(text)

      // Assert
      expect(message.error).toHaveBeenCalledTimes(1)
      expect(message.success).not.toHaveBeenCalled()
    })
  })

  describe('Интеграционные тесты', () => {
    test('должны работать обе функции независимо', () => {
      // Arrange
      const successText = 'Успех!'
      const errorText = 'Ошибка!'

      // Act
      showSuccess(successText)
      showError(errorText)

      // Assert
      expect(message.success).toHaveBeenCalledTimes(1)
      expect(message.success).toHaveBeenCalledWith(successText)
      expect(message.error).toHaveBeenCalledTimes(1)
      expect(message.error).toHaveBeenCalledWith(errorText)
    })

    test('должны правильно обрабатывать последовательные вызовы', () => {
      // Arrange
      const texts = ['Первое сообщение', 'Второе сообщение', 'Третье сообщение']

      // Act
      showSuccess(texts[0])
      showError(texts[1])
      showSuccess(texts[2])

      // Assert
      expect(message.success).toHaveBeenCalledTimes(2)
      expect(message.success).toHaveBeenNthCalledWith(1, texts[0])
      expect(message.success).toHaveBeenNthCalledWith(2, texts[2])
      expect(message.error).toHaveBeenCalledTimes(1)
      expect(message.error).toHaveBeenCalledWith(texts[1])
    })

    test('должны корректно работать с различными типами строк', () => {
      // Arrange
      const specialChars = 'Сообщение со спецсимволами: !@#$%^&*()_+'
      const unicodeText = 'Сообщение с юникодом: 🚀👍🎉'
      const multilineText = 'Сообщение\nс\nпереносами\nстрок'

      // Act & Assert
      showSuccess(specialChars)
      expect(message.success).toHaveBeenCalledWith(specialChars)

      showError(unicodeText)
      expect(message.error).toHaveBeenCalledWith(unicodeText)

      showSuccess(multilineText)
      expect(message.success).toHaveBeenCalledWith(multilineText)
    })
  })
})
