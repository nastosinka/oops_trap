Основные команды для проекта:
npm install //в папке backend 
npm start  //запуск сервера
node src/client.js  //подключение клиента
Выбранные технологии:

prisma orm, jwt, axios, dotenv, express.js, jest-test framework


Запуск бд из папки backend:

    - docker build --no-cache -t opps-liquibase .
    - docker-compose up -d postgres
    - docker-compose --profile migration up liquibase

Очистить полностью:
    - docker-compose down -v 