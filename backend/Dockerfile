# 后端 Dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装编译依赖
RUN apk add --no-cache python3 make g++

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY tsconfig.json ./
COPY src ./src

# 编译 TypeScript
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["npm", "start"]