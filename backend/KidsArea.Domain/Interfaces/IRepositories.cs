using KidsArea.Domain.Entities;
namespace KidsArea.Domain.Interfaces;

public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(int id);
    Task<List<T>> GetAllAsync();
    Task AddAsync(T entity);
    void Update(T entity);
    Task SaveAsync();
}

public interface IVisitRepository : IRepository<Visit>
{
    Task<Visit?> GetActiveByReceiptAsync(string receipt);
    Task<List<Visit>> SearchActiveByReceiptFragmentAsync(string fragment);
    Task<List<Visit>> GetActiveVisitsAsync();
    Task<string> NextReceiptNumberAsync();
    Task<List<Visit>> GetByShiftAsync(int shiftId);
}

public interface ICustomerRepository : IRepository<Customer>
{
    Task<Customer?> GetByPhoneAsync(string phone);
    Task<List<Customer>> SearchByPhoneFragmentAsync(string fragment);
}
