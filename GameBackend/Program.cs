using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Http;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Entity Framework with SQLite
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite("Data Source=game.db")
);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors("AllowAll");


using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Add this endpoint to handle the root path
app.MapGet("/", () => "Welcome to the Car Game API!");

// Register player's name
app.MapPost("/players", async (ApplicationDbContext db, PlayerNameRequest request) =>
{
    if (string.IsNullOrEmpty(request.PlayerName))
    {
        return Results.BadRequest("Player name is required");
    }

    var existingUser = await db.UserProfiles.FirstOrDefaultAsync(u => u.PlayerName == request.PlayerName);

    // If player already exists:
    if (existingUser != null)
    {
        return Results.BadRequest("Player name already exists");
    }

    // If player doesn't already exist
    var newUser = new UserProfile
    {
        PlayerName = request.PlayerName,
        HighScore = 0
    };

    db.UserProfiles.Add(newUser);
    await db.SaveChangesAsync();

    return Results.Ok(new { message = "New player registered successfully" });
});


// Endpoint to submit a player's score
// Endpoint to submit a player's score
app.MapPost("/submit-score", async (ApplicationDbContext db, PlayerScore score) =>
{
    if (string.IsNullOrEmpty(score.PlayerName) || score.Score < 0)
    {
        return Results.BadRequest("Invalid score data.");
    }

    var userProfile = await db.UserProfiles
        .FirstOrDefaultAsync(u => u.PlayerName == score.PlayerName);

    if (score.Score > userProfile.HighScore)
    {
        // Update the high score if the new score is higher
        userProfile.HighScore = score.Score;
    }

    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Score submitted" });
});


// Endpoint to get all player profiles
/* app.MapGet("/playerslist", async (ApplicationDbContext db) =>
{
    var allProfiles = await db.UserProfiles.ToListAsync();

    if (allProfiles == null || allProfiles.Count == 0)
    {
        return Results.NotFound(new { message = "No player profiles found." });
    }

    return Results.Ok(allProfiles);
}); */



// Endpoint to get a player's high score
app.MapGet("/high-score/{playerName}", async (ApplicationDbContext db, string playerName) =>
{
    var userProfile = await db.UserProfiles
        .FirstOrDefaultAsync(u => u.PlayerName == playerName);

    if (userProfile == null)
    {
        return Results.NotFound(new { message = "Player not found." });
    }

    return Results.Ok(new { userProfile.PlayerName, userProfile.HighScore });
});


app.Run();

// Define the GameSession model (this represents a "row" in the database)
public record PlayerScore
{
    public string PlayerName { get; set; }
    public int Score { get; set; }
}

public record PlayerNameRequest
{
    public string PlayerName { get; set; }
}

// Define the UserProfile model (this represents user data in the database)
public class UserProfile
{
    public int Id { get; set; }
    public string PlayerName { get; set; }
    public int HighScore { get; set; }
}

// Define the ApplicationDbContext (this represents the database context)
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    { }

    public DbSet<UserProfile> UserProfiles { get; set; }
}
