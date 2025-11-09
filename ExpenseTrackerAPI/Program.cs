using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using ExpenseTrackerAPI.Services;
using ExpenseTrackerAPI.Infrastructure;
using ExpenseTrackerAPI.Services.Contracts;

var builder = WebApplication.CreateBuilder(args);


// 🔹 Database Configuration

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsqlOptions => npgsqlOptions.CommandTimeout(60)
    );
});


// 🔹 Identity Setup

builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();


// 🔹 JWT Authentication Setup

var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];
var jwtKey = builder.Configuration["Jwt:Key"];

if (string.IsNullOrEmpty(jwtIssuer) || string.IsNullOrEmpty(jwtAudience) || string.IsNullOrEmpty(jwtKey))
{
    throw new InvalidOperationException("JWT settings are missing in configuration (Issuer, Audience, or Key).");
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "JwtBearer";
    options.DefaultChallengeScheme = "JwtBearer";
})
.AddJwtBearer("JwtBearer", options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});


// 🔹 CORS, Controllers, Swagger

builder.Services.AddCors();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();


// 🔹 Swagger Configuration

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ExpenseTracker API",
        Version = "v1",
        Description = "Expense tracking and reimbursement management API"
    });

    // JWT Authorization in Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: **Bearer {token}**",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});


// 🔹 Authorization Policies

builder.Services.AddAuthorization(opt =>
{
    opt.AddPolicy("RequireManager", p => p.RequireRole("Manager", "Admin"));
    opt.AddPolicy("RequireAdmin", p => p.RequireRole("Admin"));
});


// 🔹 Dependency Injection (Services)

builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IExpensesService, ExpensesService>();
builder.Services.AddScoped<INotificationQueryService, NotificationQueryService>();
builder.Services.AddScoped<IReimbursementsService, ReimbursementsService>();
builder.Services.AddScoped<IBudgetService, BudgetService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<IAuthService, AuthService>();


// 🔹 Build the App

var app = builder.Build();

// 🔹 Seed Data (Roles, Admin, Manager, Categories)

using (var scope = app.Services.CreateScope())
{
    var roleMgr = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userMgr = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    await db.Database.MigrateAsync();

    string[] roles = { "Employee", "Manager", "Admin" };
    foreach (var r in roles)
    {
        if (!await roleMgr.RoleExistsAsync(r))
            await roleMgr.CreateAsync(new IdentityRole(r));
    }

    // Seed Admin
    var adminEmail = "admin@org.com";
    var admin = await userMgr.FindByEmailAsync(adminEmail);
    if (admin == null)
    {
        admin = new ApplicationUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            FullName = "Admin",
            Role = "Admin",
            EmployeeId = "ADMIN"
        };
        await userMgr.CreateAsync(admin, "Admin@12345");
        await userMgr.AddToRoleAsync(admin, "Admin");
    }

    // Seed Manager
    var mgrEmail = "manager@org.com";
    var manager = await userMgr.FindByEmailAsync(mgrEmail);
    if (manager == null)
    {
        manager = new ApplicationUser
        {
            UserName = mgrEmail,
            Email = mgrEmail,
            FullName = "Manager",
            Role = "Manager",
            EmployeeId = "MGR-0001"
        };
        await userMgr.CreateAsync(manager, "Manager@12345");
        await userMgr.AddToRoleAsync(manager, "Manager");
    }

    // Seed Categories (if none)
    if (!db.Categories.Any())
    {
        db.Categories.AddRange(
            new Category { Name = "Travel" },
            new Category { Name = "Meals" },
            new Category { Name = "Supplies" },
            new Category { Name = "Lodging" },
            new Category { Name = "Software & Subscriptions" }
        );
        await db.SaveChangesAsync();
    }
}

// 🔹 Middleware Pipeline

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors(policy => policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
