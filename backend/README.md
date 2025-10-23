Основные команды для проекта:

Выбранные технологии:

prisma orm, jwt, axios, dotenv, express.js, jest-test framework


Запуск бд из папки backend:

    - docker build --no-cache -t opps-liquibase .
    - docker-compose up -d postgres
    - docker-compose --profile migration up liquibase

Очистить полностью:
    - docker-compose down -v 