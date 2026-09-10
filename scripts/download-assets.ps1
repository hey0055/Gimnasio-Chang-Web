$ErrorActionPreference = 'Stop'

$siteRoot = 'https://www.gimnasiochang.com'
$pages = @(
  '/',
  '/index.php/about/',
  '/index.php/maestros/',
  '/index.php/taekwondo/',
  '/index.php/patrocinadores/',
  '/index.php/zona-club/',
  '/index.php/category/academia/',
  '/index.php/2026/05/21/breve-analisis-del-campeonato-de-europa-de-kyorugi-2026/',
  '/index.php/2026/04/13/mas-sobre-numeros6/',
  '/index.php/2026/04/06/guia-para-atarse-el-cinturon-de-taekwondo/',
  '/index.php/2026/03/23/are-maki-tecnica-basica/',
  '/index.php/2026/03/18/horario-de-fallas-2026/',
  '/index.php/2026/03/09/aprendiendo-coreano-cap-2-del-1-al-10/',
  '/index.php/2026/03/02/basicos-del-apchagui/',
  '/index.php/2025/12/05/un-examen-de-grados-en-el-chang/',
  '/index.php/2025/02/01/club-oficial-desde-1978/',
  '/index.php/2025/01/08/empezamos-este-2025/'
)
$assetRoot = Join-Path $PSScriptRoot '..\public\assets\legacy'
New-Item -ItemType Directory -Force -Path $assetRoot | Out-Null

# URLs históricas distintas que contenían exactamente la misma imagen.
$assetAliases = @{
  '2009/12/Gimnasio-chang-07301.jpg' = '2009/12/Gimnasio-chang-0730.jpg'
  '2009/12/Gimnasio-chang-07302.jpg' = '2009/12/Gimnasio-chang-0730.jpg'
  '2009/12/Gimnasio-chang-07301-150x150.jpg' = '2009/12/Gimnasio-chang-0730-150x150.jpg'
  '2009/12/Gimnasio-chang-07302-150x150.jpg' = '2009/12/Gimnasio-chang-0730-150x150.jpg'
  '2009/12/Gimnasio-Chang-Infantil1.jpg' = '2009/12/Gimnasio-Chang-Infantil.jpg'
  '2009/12/Gimnasio-Chang-Infantil1-150x150.jpg' = '2009/12/Gimnasio-Chang-Infantil-150x150.jpg'
  '2009/12/Gimnasio-chang-08301.jpg' = '2009/12/Gimnasio-chang-0830.jpg'
  '2009/12/Gimnasio-chang-08301-150x150.jpg' = '2009/12/Gimnasio-chang-0830-150x150.jpg'
}

$assetUrls = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

foreach ($path in $pages) {
  $pageUrl = "$siteRoot$path"
  Write-Host "Scanning $pageUrl"
  $html = (Invoke-WebRequest -UseBasicParsing -Uri $pageUrl).Content
  $html = [regex]::Replace($html, '(?is)\s+(?:srcset|sizes)=("[^"]*"|''[^'']*'')', '')

  $matches = [regex]::Matches($html, '(?i)(?:https?:)?//[^"''\s<>]+/wp-content/uploads/[^"''\s<>]+|/wp-content/uploads/[^"''\s<>]+')
  foreach ($match in $matches) {
    $candidate = $match.Value.TrimEnd(',', ')')
    if ($candidate.StartsWith('//')) { $candidate = "https:$candidate" }
    if ($candidate.StartsWith('/')) { $candidate = "$siteRoot$candidate" }
    $candidate = $candidate -replace '^http://', 'https://'
    $assetUrls.Add($candidate) | Out-Null
  }
}

$manifest = @()
foreach ($assetUrl in $assetUrls) {
  try {
    $uri = [System.Uri]$assetUrl
    $relativePath = $uri.AbsolutePath -replace '^/wp-content/uploads/', ''
    if ([string]::IsNullOrWhiteSpace($relativePath)) { continue }
    $relativePath = [System.Uri]::UnescapeDataString($relativePath)
    if ($assetAliases.ContainsKey($relativePath)) { $relativePath = $assetAliases[$relativePath] }
    $destination = Join-Path $assetRoot $relativePath
    $directory = Split-Path -Parent $destination
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
    if (-not (Test-Path -LiteralPath $destination)) {
      Write-Host "Downloading $relativePath"
      Invoke-WebRequest -UseBasicParsing -Uri $assetUrl -OutFile $destination
    }
    $manifest += [PSCustomObject]@{
      source = $assetUrl
      local = "/assets/legacy/$($relativePath -replace '\\', '/')"
    }
  } catch {
    Write-Warning "Could not download $assetUrl : $($_.Exception.Message)"
  }
}

$manifest | Sort-Object local | ConvertTo-Json -Depth 3 | Set-Content -Encoding UTF8 (Join-Path $assetRoot 'manifest.json')
Write-Host "Downloaded $($manifest.Count) assets."
Write-Host 'Después ejecuta node scripts/organize-legacy-assets.mjs y npm run build.'
