"""
Pagination utilities
"""
from typing import TypeVar, Generic, List
from pydantic import BaseModel

T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Generic paginated response
    """
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int

    class Config:
        arbitrary_types_allowed = True


def paginate(queryset, page: int = 1, page_size: int = 10):
    """
    Paginate a Django queryset
    """
    total = queryset.count()
    total_pages = (total + page_size - 1) // page_size

    start = (page - 1) * page_size
    end = start + page_size

    items = list(queryset[start:end])

    return {
        'items': items,
        'total': total,
        'page': page,
        'page_size': page_size,
        'total_pages': total_pages
    }
