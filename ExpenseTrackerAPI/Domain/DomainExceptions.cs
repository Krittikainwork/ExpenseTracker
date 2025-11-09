using System;

namespace ExpenseTrackerAPI.Domain
{
    // Base type for business-rule exceptions
    public abstract class DomainException : Exception
    {
        protected DomainException(string message) : base(message) { }
        protected DomainException(string message, Exception? inner) : base(message, inner) { }
    }

    public sealed class NotFoundException : DomainException
    {
        public NotFoundException(string entity, object key)
            : base($"{entity} with key '{key}' was not found.") { }
    }

    public sealed class ValidationException : DomainException
    {
        public ValidationException(string message) : base(message) { }
    }

    public sealed class NotAllowedException : DomainException
    {
        public NotAllowedException(string message) : base(message) { }
    }

    public sealed class InsufficientBudgetException : DomainException
    {
        public InsufficientBudgetException(decimal requested, decimal remaining)
            : base($"Insufficient budget. Requested={requested}, Remaining={remaining}") { }
    }

    public sealed class ConcurrencyConflictException : DomainException
    {
        public ConcurrencyConflictException(string message, Exception? inner = null)
            : base(message, inner) { }
    }
}