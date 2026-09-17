"""Category business logic (service layer).

Category management is centralized here so the controller stays thin and
deletion protects existing tickets.
"""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.category import Category
from models.ticket import Ticket
from models.user import User
from services.mongo_service import log_activity


def _raise_categories_not_found() -> None:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Category not found",
    )


def _raise_name_taken(name: str) -> None:
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=f"Category name already exists: {name}",
    )


def _category_by_name(db: Session, name: str) -> Category | None:
    return db.query(Category).filter(Category.name == name).first()


def list_categories(db: Session) -> list[Category]:
    """Return all categories ordered by name."""
    return db.query(Category).order_by(Category.name.asc()).all()


def get_category(db: Session, category_id: int) -> Category:
    """Return a category by id (404 when missing)."""
    category = db.query(Category).filter(Category.category_id == category_id).first()
    if category is None:
        _raise_categories_not_found()
    return category


def create_category(
    db: Session, name: str, description: str | None, actor: User
) -> Category:
    """Create a category, rejecting duplicate names."""
    if _category_by_name(db, name) is not None:
        _raise_name_taken(name)
    category = Category(name=name, description=description)
    db.add(category)
    db.commit()
    db.refresh(category)
    log_activity(
        activity_type="category_created",
        performed_by=actor,
        old_value=None,
        new_value={"category_id": category.category_id, "name": category.name},
    )
    return category


def update_category(
    db: Session,
    category: Category,
    name: str | None,
    description: str | None,
    actor: User,
) -> Category:
    """Update a category, rejecting name collisions with other categories."""
    old_name = category.name
    old_description = category.description
    if name is not None:
        existing = _category_by_name(db, name)
        if existing is not None and existing.category_id != category.category_id:
            _raise_name_taken(name)
        category.name = name
    if description is not None:
        category.description = description
    db.commit()
    db.refresh(category)
    log_activity(
        activity_type="category_updated",
        performed_by=actor,
        old_value={"name": old_name, "description": old_description},
        new_value={"name": category.name, "description": category.description},
        category_id=category.category_id,
    )
    return category


def delete_category(db: Session, category: Category, actor: User) -> None:
    """Delete a category, refusing when tickets still reference it."""
    in_use = (
        db.query(Ticket).filter(Ticket.category_id == category.category_id).count()
    )
    if in_use:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a category that has tickets",
        )
    deleted = {
        "category_id": category.category_id,
        "name": category.name,
    }
    db.delete(category)
    db.commit()
    log_activity(
        activity_type="category_deleted",
        performed_by=actor,
        old_value=deleted,
        new_value=None,
    )