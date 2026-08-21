"""Alembic migration environment for ATLAS.

The target metadata is the app's SQLAlchemy Base, populated by importing all
model modules. The database URL comes from the DATABASE_URL environment
variable (same source the app uses) rather than alembic.ini.
"""
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool
from dotenv import load_dotenv

load_dotenv()

# Import Base and all models so that Base.metadata is fully populated.
from database.connection import Base
import models.permission  # noqa: F401
import models.role  # noqa: F401
import models.user  # noqa: F401
import models.applicant  # noqa: F401
import models.offer_onboarding  # noqa: F401
import models.email  # noqa: F401
import models.communications  # noqa: F401
import models.interview_engine  # noqa: F401

config = context.config

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL must be set to run migrations.")
config.set_main_option("sqlalchemy.url", DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
