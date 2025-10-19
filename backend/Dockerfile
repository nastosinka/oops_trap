FROM liquibase/liquibase:4.25

# Копируем changelog файлы
COPY src/main/resources/changelog/ /liquibase/changelog/

WORKDIR /liquibase

# Убедимся что команда по умолчанию есть
CMD ["--help"]