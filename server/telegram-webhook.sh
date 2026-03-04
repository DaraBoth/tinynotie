#!/bin/bash
# Helper script to manage Telegram Bot Webhook

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="https://api.telegram.org"

# Check if required env vars are set
if [ -z "$TELEGRAM_BOT_TOKEN_NEW" ]; then
    echo -e "${RED}Error: TELEGRAM_BOT_TOKEN_NEW is not set${NC}"
    exit 1
fi

if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ./telegram-webhook.sh info          - Get webhook info"
    echo "  ./telegram-webhook.sh set <url>     - Set webhook URL"
    echo "  ./telegram-webhook.sh delete        - Delete webhook (go to polling)"
    echo ""
    echo "Example:"
    echo "  ./telegram-webhook.sh set https://tinynotie-api.vercel.app/bot/webhook"
    exit 1
fi

TOKEN=$TELEGRAM_BOT_TOKEN_NEW

case "$1" in
    info)
        echo -e "${YELLOW}Getting webhook info...${NC}"
        curl -s -X POST \
            "${API_URL}/bot${TOKEN}/getWebhookInfo" \
            -H "Content-Type: application/json" | jq .
        ;;
    set)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Webhook URL required${NC}"
            echo "Usage: ./telegram-webhook.sh set <url>"
            exit 1
        fi
        echo -e "${YELLOW}Setting webhook to: $2${NC}"
        curl -s -X POST \
            "${API_URL}/bot${TOKEN}/setWebhook" \
            -H "Content-Type: application/json" \
            -d "{\"url\": \"$2\", \"allowed_updates\": [\"message\", \"callback_query\", \"my_chat_member\"]}" | jq .
        ;;
    delete)
        echo -e "${YELLOW}Deleting webhook...${NC}"
        curl -s -X POST \
            "${API_URL}/bot${TOKEN}/deleteWebhook" \
            -H "Content-Type: application/json" | jq .
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        exit 1
        ;;
esac
