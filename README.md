# ERP

Project Overview
This is a full-stack Enterprise Resource Planning (ERP) System with a Java Spring Boot backend and React frontend. It's a comprehensive business management solution designed to handle various operations like inventory, purchasing, sales, users, and financial reporting.

🏗️ Architecture
Tech Stack:

Backend: Java 17, Spring Boot 3.5.5, JPA/Hibernate
Frontend: React 18.3.1, Vite, React Router v6
Database: MySQL (AWS TiDB Cloud in production)
Authentication: JWT (JSON Web Tokens)
Server Port: 9070
📦 Backend Structure (97 Java files)
Technology Stack:

Spring Boot Web, Security, Data-JPA
JWT for stateless authentication
Spring Mail (Gmail SMTP configured)
Image processing (Thumbnailator for image resizing)
Lombok for code generation
MySQL with Hikari connection pooling
Modules (13 Controllers):

User Management - User authentication, password history
Item Management - Product/inventory items
Retailer Management - Retailer/customer data
Supplier Management - Supplier information
Purchase - Purchase orders and operations
Order - Sales orders
Sale - Sales transactions
Stock - Inventory management
Packing - Order packing operations
Collection - Payment collections
SaleReturn - Sales return processing
Financial Year - Multi-year financial tracking
User Master & Module Master - System configuration and module management
Key Features:

JPA Auditing - Auto-tracks createdBy, createdDate, lastModifiedBy, lastModifiedDate
Base Entity Pattern - Cleans empty strings before persistence
CORS Configuration - Enabled for cross-origin requests
JWT Filter - Validates tokens on secured endpoints
Global Exception Handling - Centralized error management
File Uploads - 10MB per file, 70MB per request limit
🎨 Frontend Structure (21 React Components)
Framework: React 18 with Vite bundler

Key Dependencies:

axios - HTTP client for API calls
react-router-dom - Client-side routing
react-select - Dropdown/select components
react-beautiful-dnd - Drag-and-drop functionality
react-masonry-css - Masonry layout
bootstrap - UI styling
react-icons - Icon library
Components:

Auth: Login component
Navigation: HeaderComponent, SideBar, FooterComponent
Dashboard - Main dashboard
Core Modules: Retailer, Item, Purchase, Order, Sale, Collection, SaleReturn, Stock, Supplier, Packing
Administration: UserMaster, ModuleMaster, Settings, FinancialYearMaster, MyAccount
Reporting: FinancialReport
Utilities: ProtectedRoute (access control), MessageAndConfirmation (toast notifications)
🔐 Security & Configuration
Authentication:

JWT-based stateless authentication
BCrypt password encoding
Session timeout: 30 minutes
User password history tracking
Database Config:

Production: AWS TiDB Cloud (MySQL compatible)
Connection pooling via Hikari
Auto schema update on startup (ddl-auto: update)
Timezone: Asia/Kolkata
Mail Service:

Gmail SMTP configuration
Used for notifications and email communications
📊 Data Model Highlights
Base Auditing: All entities inherit from BaseAuditEntity with audit tracking
String Normalization: Empty strings are converted to NULL before saving
ID Generation: Custom ID generators for headers and details (possibly for document numbering)
