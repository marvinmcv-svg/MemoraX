$body = @{
    content = "Remind me to call mom tomorrow at 2pm"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/ai/classify" -Method POST -ContentType "application/json" -Body $body
    Write-Output "MiniMax Classification Result:"
    $response | ConvertTo-Json
} catch {
    Write-Output "Error: $_"
}