import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });
const sampleNotes = [
  {
    title: "微積分期中考重點整理",
    description: "整理極限、微分與應用題型",
    content: "本筆記包含極限、連續、導數、微分應用、切線斜率與最佳化問題，適合微積分期中考複習。",
    fileUrl: "https://example.com/calculus-midterm.pdf",
    course: "微積分",
    category: "考試整理",
    views: 128,
    likes: 36,
    tags: ["微積分", "期中考", "數學"],
  },
  {
    title: "工程數學 Fourier Series 筆記",
    description: "傅立葉級數、奇偶函數與係數計算",
    content: "內容說明 Fourier series、a0、an、bn 的積分方式，並整理奇函數、偶函數判斷與分段積分技巧。",
    fileUrl: "https://example.com/fourier-series.pdf",
    course: "工程數學",
    category: "章節筆記",
    views: 96,
    likes: 24,
    tags: ["工程數學", "傅立葉", "期末考"],
  },
  {
    title: "資料庫設計 ER Model 基礎",
    description: "資料表、主鍵、外鍵與多對多關係",
    content: "整理 Entity Relationship Model、Primary Key、Foreign Key、Composite Key 與多對多關係轉換成關聯資料表的方法。",
    fileUrl: "https://example.com/database-er-model.pdf",
    course: "資料庫設計",
    category: "概念整理",
    views: 75,
    likes: 19,
    tags: ["資料庫", "ERD", "SQL"],
  },
  {
    title: "作業研究 Simplex Method 速查",
    description: "線性規劃與單形法表格解題",
    content: "內容包含 Linear Programming、Simplex tableau、進入變數、離開變數、基底變數與最佳解判斷流程。",
    fileUrl: "https://example.com/simplex-method.pdf",
    course: "作業研究",
    category: "解題流程",
    views: 143,
    likes: 41,
    tags: ["作業研究", "線性規劃", "Simplex"],
  },
  {
    title: "統計學 P-value 與假設檢定",
    description: "左尾、右尾、雙尾檢定整理",
    content: "整理 Z 檢定、t 檢定、p-value、拒絕域、顯著水準 alpha，以及雙尾檢定如何判斷是否拒絕虛無假設。",
    fileUrl: "https://example.com/statistics-pvalue.pdf",
    course: "統計學",
    category: "考試整理",
    views: 118,
    likes: 33,
    tags: ["統計", "P-value", "假設檢定"],
  },
  {
    title: "JavaScript REST API 基礎",
    description: "Express 路由、Controller 與 Service 分層",
    content: "本筆記介紹 REST API、HTTP method、route、controller、service、middleware 與錯誤處理，適合後端入門。",
    fileUrl: "https://example.com/js-rest-api.pdf",
    course: "程式設計",
    category: "後端開發",
    views: 88,
    likes: 26,
    tags: ["JavaScript", "Express", "API"],
  },
  {
    title: "Prisma ORM 與 SQLite 開發流程",
    description: "Schema、Migration、Seed 與查詢語法",
    content: "整理 Prisma schema、model relation、migrate dev、seed data、findMany、create、include 與 relation 查詢。",
    fileUrl: "https://example.com/prisma-sqlite.pdf",
    course: "資料庫設計",
    category: "後端開發",
    views: 82,
    likes: 22,
    tags: ["Prisma", "SQLite", "ORM"],
  },
  {
    title: "智慧製造 Industry 4.0 課堂整理",
    description: "智慧工廠、數位轉型與系統整合",
    content: "內容包含 Industry 4.0、智慧製造、機器手臂、感測器、資料整合、KPI 與工廠數位轉型案例。",
    fileUrl: "https://example.com/smart-manufacturing.pdf",
    course: "智慧製造導論",
    category: "課堂心得",
    views: 67,
    likes: 15,
    tags: ["智慧製造", "工業4.0", "系統整合"],
  },
  {
    title: "工程經濟 NPV 與年值法整理",
    description: "現值、年值、回收期與投資評估",
    content: "整理 NPV、PW、AW、AE、AEC、P/A、F/A 與殘值計算，適合工程經濟考前複習。",
    fileUrl: "https://example.com/engineering-economics.pdf",
    course: "工程經濟",
    category: "公式整理",
    views: 102,
    likes: 27,
    tags: ["工程經濟", "NPV", "年值法"],
  },
  {
    title: "C++ Competitive Programming 入門",
    description: "基礎語法、陣列、排序與 STL",
    content: "整理 C++ 輸入輸出、vector、sort、map、set、pair、迴圈與基礎競程解題技巧。",
    fileUrl: "https://example.com/cpp-cp.pdf",
    course: "程式設計",
    category: "程式競賽",
    views: 134,
    likes: 39,
    tags: ["C++", "競程", "STL"],
  },
];

async function main() {
  const hashedPassword = await bcrypt.hash("123456", 10);

  const user = await prisma.user.upsert({
    where: { email: "test@uninotes.com" },
    update: {},
    create: {
      name: "Test User",
      email: "test@uninotes.com",
      password: hashedPassword,
    },
  });

  for (const item of sampleNotes) {
    const note = await prisma.note.create({
      data: {
        title: item.title,
        description: item.description,
        content: item.content,
        fileUrl: item.fileUrl,
        course: item.course,
        category: item.category,
        views: item.views,
        likes: item.likes,
        authorId: user.id,
      },
    });

    for (const tagName of item.tags) {
      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      });

      await prisma.noteTag.create({
        data: {
          noteId: note.id,
          tagId: tag.id,
        },
      });
    }
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
