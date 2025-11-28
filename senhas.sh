PROJECT_URL="https://djnzhlvkaatcsavgshzk.supabase.co"
SERVICE_ROLE="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbnpobHZrYWF0Y3NhdmdzaHprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA1NzQ5NiwiZXhwIjoyMDc5NjMzNDk2fQ.0GVvUVRjbqIYKIJGkFGm5ZBTPVa_TfNmyf56vpUiPAc"
PASSWORD="123456"

USER_IDS=(
  "550e8400-e29b-41d4-a716-446655440001"
  "550e8400-e29b-41d4-a716-446655440002"
  "550e8400-e29b-41d4-a716-446655440003"
  "550e8400-e29b-41d4-a716-446655440004"
  "550e8400-e29b-41d4-a716-446655440005"
  "550e8400-e29b-41d4-a716-446655440006"
)

for USER_ID in "${USER_IDS[@]}"; do
  echo "Atualizando senha do usuário $USER_ID..."
  curl -i \
  -H "apikey: $SERVICE_ROLE" \
  -H "Authorization: Bearer $SERVICE_ROLE" \
  "$PROJECT_URL/auth/v1/admin/users?per_page=1"
done