"""
Basic tests to verify the testing setup works
"""
import pytest


def test_basic_math():
    """Test basic math operations"""
    assert 1 + 1 == 2
    assert 2 * 3 == 6


def test_string_operations():
    """Test string operations"""
    assert "hello" + " world" == "hello world"
    assert "python".upper() == "PYTHON"


def test_list_operations():
    """Test list operations"""
    my_list = [1, 2, 3]
    assert len(my_list) == 3
    assert 2 in my_list
    assert my_list[0] == 1


@pytest.mark.asyncio
async def test_async_function():
    """Test async function"""
    async def async_add(a, b):
        return a + b

    result = await async_add(3, 4)
    assert result == 7
