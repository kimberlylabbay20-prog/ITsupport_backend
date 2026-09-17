"""Category controller with category management endpoints.

Routes (physically defined here):
- GET    /categories                list categories (any authenticated user)
- GET    /categories/{category_id}  view a category (any authenticated user)
- POST   /categories                create a category (admin only)
- PUT    /categories/{category_id}  update a category (admin only)
- DELETE /categories/{category_id}  delete a category (admin only)

Category deletion is refused while tickets reference the category so that
no existing ticket is left broken.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database.postgres import get_db
from models.category import Category
from models.user import User
from schemas.category_schema import CategoryCreate, CategoryResponse, CategoryUpdate
from services.auth_service import get_current_user, require_admin
from services.category_service import (
    create_category,
    delete_category,
    get_category,
    list_categories,
    update_category,
)

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
def categories_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Category]:
    """List all categories (any authenticated user)."""
    return list_categories(db)


@router.get("/{category_id}", response_model=CategoryResponse)
def category_detail(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Category:
    """View a single category (any authenticated user)."""
    return get_category(db, category_id)


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def categories_create(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Category:
    """Create a category (admin only)."""
    return create_category(db, payload.name, payload.description, current_user)


@router.put("/{category_id}", response_model=CategoryResponse)
def category_update(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Category:
    """Update a category (admin only)."""
    category = get_category(db, category_id)
    return update_category(db, category, payload.name, payload.description, current_user)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def category_delete(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> None:
    """Delete a category (admin only); refuses while tickets reference it."""
    category = get_category(db, category_id)
    delete_category(db, category, current_user)