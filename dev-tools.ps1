function Show-Menu {
    Clear-Host
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host "      Node.js Docker Dev Tools   " -ForegroundColor Green
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host " 1) Start container"
    Write-Host " 2) Restart container (rebuild everything)"
    Write-Host " 3) Enter container shell"
    Write-Host " 4) View logs"
    Write-Host " 5) Stop container"
    Write-Host " 6) Remove container + volume"
    Write-Host " 7) Rebuild dependencies (npm install in container)"
    Write-Host " 8) Run database migrations"
    Write-Host " 9) Run database seed script"
    Write-Host "10) Backup SQLite database"
    Write-Host "11) Restore SQLite database from backup"
    Write-Host "12) Run tests"
    Write-Host "13) Show running containers"
    Write-Host "14) Clean up dangling images/volumes"
    Write-Host "15) Hot rebuild image and restart container"
    Write-Host "16) Show container status"
    Write-Host "17) Tail logs with timestamps"
    Write-Host "18) Open interactive Node.js REPL inside container"
    Write-Host "19) Export container to tar file (backup)"
    Write-Host "20) Import container tar backup"
    Write-Host "21) Push image to Docker Hub"
    Write-Host "22) Pull image from Docker Hub"
    Write-Host " 0) Exit"
    Write-Host "=================================" -ForegroundColor Cyan
}

do {
    Show-Menu
    $choice = Read-Host "Select an option (0-22)"

    switch ($choice) {
        "1" {
            Write-Host "Starting container..." -ForegroundColor Yellow
            $container = docker ps -a --filter "name=my-node-dev" --format "{{.Names}}"
            if ($container -eq "my-node-dev") {
                docker start my-node-dev
            } else {
                docker run -d --name my-node-dev -p 3000:3000 `
                  -v ${PWD}:/usr/src/app `
                  -v node_modules_volume:/usr/src/app/node_modules `
                  node-docker-dev
            }
            docker logs -f my-node-dev
        }
        "2" {
            Write-Host "Restarting and rebuilding container..." -ForegroundColor Yellow
            docker stop my-node-dev -ErrorAction SilentlyContinue
            docker rm my-node-dev -ErrorAction SilentlyContinue
            docker volume rm node_modules_volume -f -ErrorAction SilentlyContinue
            docker volume create node_modules_volume
            docker build -f Dockerfile.dev -t node-docker-dev .
            docker run -d --name my-node-dev -p 3000:3000 `
              -v ${PWD}:/usr/src/app `
              -v node_modules_volume:/usr/src/app/node_modules `
              node-docker-dev
            docker exec -it my-node-dev sh -c "npm rebuild && npm install"
            docker logs -f my-node-dev
        }
        "3" { docker exec -it my-node-dev sh }
        "4" { docker logs -f my-node-dev }
        "5" { docker stop my-node-dev }
        "6" {
            Write-Host "Removing container + volume..." -ForegroundColor Red
            docker stop my-node-dev -ErrorAction SilentlyContinue
            docker rm my-node-dev -ErrorAction SilentlyContinue
            docker volume rm node_modules_volume -f -ErrorAction SilentlyContinue
        }
        "7" { docker exec -it my-node-dev sh -c "npm rebuild && npm install" }
        "8" { docker exec -it my-node-dev sh -c "npm run migrate" }
        "9" { docker exec -it my-node-dev sh -c "npm run seed" }
        "10" {
            docker cp my-node-dev:/usr/src/app/database.sqlite ./database-backup.sqlite
            Write-Host "Backup saved as database-backup.sqlite" -ForegroundColor Green
        }
        "11" {
            if (Test-Path "./database-backup.sqlite") {
                docker cp ./database-backup.sqlite my-node-dev:/usr/src/app/database.sqlite
                Write-Host "Database restored" -ForegroundColor Green
            } else {
                Write-Host "No backup file found!" -ForegroundColor Red
            }
        }
        "12" { docker exec -it my-node-dev sh -c "npm test" }
        "13" { docker ps }
        "14" {
            Write-Host "Cleaning up unused images/volumes..." -ForegroundColor Yellow
            docker system prune -f
            docker volume prune -f
        }
        "15" {
            Write-Host "Hot rebuilding image + restarting container..." -ForegroundColor Yellow
            docker stop my-node-dev -ErrorAction SilentlyContinue
            docker rm my-node-dev -ErrorAction SilentlyContinue
            docker build -f Dockerfile.dev -t node-docker-dev .
            docker run -d --name my-node-dev -p 3000:3000 `
              -v ${PWD}:/usr/src/app `
              -v node_modules_volume:/usr/src/app/node_modules `
              node-docker-dev
            docker logs -f my-node-dev
        }
        "16" { docker ps -a --filter "name=my-node-dev" }
        "17" { docker logs -f --timestamps my-node-dev }
        "18" { docker exec -it my-node-dev node }
        "19" {
            docker export my-node-dev -o my-node-dev-backup.tar
            Write-Host "Container exported as my-node-dev-backup.tar" -ForegroundColor Green
        }
        "20" {
            if (Test-Path "./my-node-dev-backup.tar") {
                docker import ./my-node-dev-backup.tar my-node-dev-imported
                Write-Host "Container imported as my-node-dev-imported" -ForegroundColor Green
            } else {
                Write-Host "No backup tar file found!" -ForegroundColor Red
            }
        }
        
"21" {
    $dockerUser = Read-Host "Enter Docker Hub username"
    $imageName = Read-Host "Enter image name (e.g. my-node-app)"
    $tag = Read-Host "Enter tag (default: latest)"
    if ([string]::IsNullOrEmpty($tag)) { $tag = "latest" }

    $fullName = "$dockerUser/${imageName}:$tag"

    Write-Host "Tagging image node-docker-dev as $fullName" -ForegroundColor Yellow
    docker tag node-docker-dev $fullName

    Write-Host "Pushing $fullName to Docker Hub..." -ForegroundColor Yellow
    docker push $fullName
}

# Option 22: Pull and run from Docker Hub
"22" {
    $dockerUser = Read-Host "Enter Docker Hub username"
    $imageName = Read-Host "Enter image name (e.g. my-node-app)"
    $tag = Read-Host "Enter tag (default: latest)"
    if ([string]::IsNullOrEmpty($tag)) { $tag = "latest" }

    $fullName = "$dockerUser/${imageName}:$tag"

    Write-Host "Pulling image $fullName from Docker Hub..." -ForegroundColor Yellow
    docker pull $fullName

    Write-Host "Running container from pulled image..." -ForegroundColor Yellow
    docker run -d --name my-node-prod -p 3001:3000 $fullName

    Write-Host "Container running as my-node-prod on port 3001" -ForegroundColor Green
}


        "0" {
            Write-Host "Exiting Dev Tools..." -ForegroundColor Cyan
            break
        }
        Default { Write-Host "Invalid option. Try again." -ForegroundColor Red }
    }

    if ($choice -ne "0") {
        Write-Host ""
        Pause
    }
} while ($choice -ne "0")
