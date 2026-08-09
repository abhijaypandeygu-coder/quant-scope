import pytest
from unittest.mock import patch, MagicMock
from core.ai_agent import AIFinancialAnalyst

@patch("core.ai_agent.AIFinancialAnalyst._get_model")
def test_chat_with_data(mock_get_model):
    mock_model = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "Mocked response from AI"
    mock_model.generate_content.return_value = mock_response
    mock_get_model.return_value = mock_model
    
    response = AIFinancialAnalyst.chat_with_data("What is the market doing?", {})
    assert response == "Mocked response from AI"
    mock_model.generate_content.assert_called_once()
