using ExpenseTrackerAPI.Data;
using ExpenseTrackerAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

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
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
       
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))

    };
});
builder.Services.AddScoped<ExpenseTrackerAPI.Services.NotificationService>();
builder.Services.AddCors();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();



builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ExpenseTracker API", Version = "v1" });

    // 🔒 Add JWT Bearer definition so the "Authorize" button appears
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.\n\n" +
                      "Enter: **Bearer {your_token}** (including the word *Bearer* and a space)",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    // 🔒 Require Bearer auth by default (for endpoints decorated with [Authorize])
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddAuthorization(opt =>
{
    opt.AddPolicy("RequireManager", p => p.RequireRole("Manager", "Admin"));
    opt.AddPolicy("RequireAdmin", p => p.RequireRole("Admin"));
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var roleMgr = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userMgr = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    string[] roles = new[] { "Employee", "Manager", "Admin" };
    foreach (var r in roles)
        if (!await roleMgr.RoleExistsAsync(r))
            await roleMgr.CreateAsync(new IdentityRole(r));
// Admin
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
        EmployeeId = "ADMIN"          // <-- ADD THIS
    };
    await userMgr.CreateAsync(admin, "Admin@12345");
    await userMgr.AddToRoleAsync(admin, "Admin");
}

// Manager
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
        EmployeeId = "MGR-0001"       // <-- ADD THIS
    };
    await userMgr.CreateAsync(manager, "Manager@12345");
    await userMgr.AddToRoleAsync(manager, "Manager");
}


    // Seed categories (first time)
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




if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}



app.UseHttpsRedirection();
app.UseCors(x => x.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
