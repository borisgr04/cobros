namespace CobrosApi.Features.Shared;

public class Result<T>
{
    public bool    IsSuccess  { get; private init; }
    public T?      Value      { get; private init; }
    public string? Error      { get; private init; }
    public int     StatusCode { get; private init; }

    private Result() { }

    public static Result<T> Ok(T value) => new()
    {
        IsSuccess  = true,
        Value      = value,
        StatusCode = 200
    };

    public static Result<T> Fail(string error, int statusCode = 400) => new()
    {
        IsSuccess  = false,
        Error      = error,
        StatusCode = statusCode
    };

    public static Result<T> NotFound(string error) => new()
    {
        IsSuccess  = false,
        Error      = error,
        StatusCode = 404
    };
}
