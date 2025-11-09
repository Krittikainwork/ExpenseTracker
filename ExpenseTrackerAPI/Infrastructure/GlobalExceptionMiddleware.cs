using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using ExpenseTrackerAPI.Domain;

namespace ExpenseTrackerAPI.Infrastructure
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task Invoke(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
            {
                // Request cancelled by client (e.g., navigation away)
                _logger.LogInformation("Request cancelled by client. {Method} {Path}", context.Request.Method, context.Request.Path);
                await WriteProblem(context, 499, "Client Closed Request", "The request was cancelled by the client.");
            }
            catch (ValidationException ex)
            {
                await WriteProblem(context, StatusCodes.Status400BadRequest, "Validation Error", ex.Message);
            }
            catch (NotFoundException ex)
            {
                await WriteProblem(context, StatusCodes.Status404NotFound, "Not Found", ex.Message);
            }
            catch (NotAllowedException ex)
            {
                await WriteProblem(context, StatusCodes.Status409Conflict, "Conflict", ex.Message);
            }
            catch (InsufficientBudgetException ex)
            {
                await WriteProblem(context, StatusCodes.Status409Conflict, "Conflict", ex.Message);
            }
            catch (ConcurrencyConflictException ex)
            {
                await WriteProblem(context, StatusCodes.Status409Conflict, "Conflict", ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception at API boundary. {Method} {Path}", context.Request.Method, context.Request.Path);
                await WriteProblem(context, StatusCodes.Status500InternalServerError, "Internal Server Error",
                    "An unexpected error occurred. Please try again later.");
            }
        }

        private static async Task WriteProblem(HttpContext ctx, int status, string title, string detail)
        {
            if (!ctx.Response.HasStarted)
            {
                ctx.Response.ContentType = "application/json";
                ctx.Response.StatusCode = status;

                var problem = new
                {
                    type = "about:blank",
                    title,
                    status,
                    detail
                };

                await ctx.Response.WriteAsync(JsonSerializer.Serialize(problem));
            }
        }
    }
}
