namespace KidsArea.Application.DTOs;

public record LoginDto(string Username, string Password);
public record LoginResultDto(string Token, string DisplayName, string Role, int UserId);

public record OpenShiftDto(decimal OpeningBalance, string? Notes);
public record CloseShiftDto(decimal ActualCash, string? EmergencyNotes);

public record CheckInDto(
    string Phone,
    string CustomerName,
    string ChildName,
    int ChildAge,
    string? ChildWristband,
    int CompanionsCount,
    List<string>? CompanionWristbands,
    int SiblingsCount,
    int Package,
    int? MembershipId,
    bool UseMembership,
    bool UseFlexibleField,
    decimal PaidCash,
    decimal PaidInstaPay,
    decimal PaidOther,
    string? InstaPayReference,
    string? Notes,
    List<SiblingInputDto>? Siblings
);

public record SiblingInputDto(string Name, int Age, string? Wristband);

public record CheckInResultDto(
    int VisitId,
    string ReceiptNumber,
    decimal TotalAmount,
    DateTime CheckInTime,
    DateTime? ExpectedCheckOutTime,
    string QrPayload
);

public record ActiveVisitDto(
    int Id,
    string ReceiptNumber,
    string ChildName,
    int ChildAge,
    string Phone,
    DateTime CheckInTime,
    string PackageName,
    int CompanionsCount,
    int SiblingsCount,
    double ElapsedMinutes,
    decimal TotalAmount,
    DateTime? ExpectedCheckOutTime,
    List<string> ChildrenNames,
    List<int> ChildrenAges,
    int ChildrenCount
);

public record CheckOutDto(
    string ReceiptNumber,
    decimal PaidCash,
    decimal PaidInstaPay,
    decimal PaidOther,
    string? InstaPayReference
);

public record CheckOutPreviewDto(
    int VisitId,
    string ReceiptNumber,
    string ChildName,
    string Phone,
    DateTime CheckInTime,
    DateTime? ExpectedCheckOutTime,
    string PackageName,
    bool IsFullDay,
    int OverageHours,
    decimal OverageAmount,
    decimal AlreadyPaid,
    decimal TotalDueNow,
    List<string> ChildrenNames,
    List<int> ChildrenAges
);

public record CheckOutResultDto(
    int VisitId,
    string ReceiptNumber,
    decimal OverageAmount,
    decimal TotalPaid,
    bool PrintExitReceipt
);

public record CustomerDto(int Id, string Phone, string Name, int ChildrenCount, List<string> ChildrenNames, int VisitsCount, DateTime? LastVisit, string? Notes);
public record CreateCustomerDto(string Phone, string Name);
public record UpdateCustomerNotesDto(string? Notes);
public record CustomerPageDto(List<CustomerDto> Items, int Page, int PageSize, int Total, int TotalPages);
public record ChildDto(int Id, string Name, int Age);

public record MembershipTypeDto(int Id, string Name, string Kind, int DurationDays, int? HoursBalance, decimal Price, bool IsActive);
public record SellMembershipDto(int CustomerId, int? ChildId, int MembershipTypeId, decimal PaidCash, decimal PaidInstaPay, decimal PaidOther, string? InstaPayReference);
public record MembershipDto(int Id, string CustomerName, string Phone, string TypeName, string Kind, DateTime StartDate, DateTime EndDate, int RemainingHours, bool IsActive);

public record PartyDto(
    string CustomerName,
    string Phone,
    DateTime? PartyDate,
    int ChildrenCount,
    decimal Amount,
    decimal PaidCash,
    decimal PaidInstaPay,
    decimal PaidOther,
    string? InstaPayReference,
    string? Notes
);

public record SettingsDto(
    string CenterName, string? CenterPhone, string ClosingTime,
    string? LogoPath, string? LoginBackgroundPath, string? HomeBackgroundPath, string IconTheme, string UiTheme,
    int GraceMinutes,
        decimal Price1Hour, decimal Price2Hours, decimal Price3Hours, decimal Price4Hours, decimal PriceFullDay,
    decimal ExtraCompanionPrice,
    bool FlexibleFieldEnabled, string FlexibleFieldLabel, decimal FlexibleFieldPrice,
    bool QrOnReceipt,
    List<SiblingPriceDto> SiblingPrices,
    List<PaymentMethodDto> PaymentMethods
);
public record SiblingPriceDto(int SiblingsCount, int DurationPackage, decimal Price);
public record PaymentMethodDto(int Id, string Name, string Code, bool IsActive, int SortOrder);
public record UpdateSettingsDto(
    string CenterName, string? CenterPhone, string ClosingTime, string IconTheme, string UiTheme,
    int GraceMinutes,
        decimal Price1Hour, decimal Price2Hours, decimal Price3Hours, decimal Price4Hours, decimal PriceFullDay,
    decimal ExtraCompanionPrice,
    bool FlexibleFieldEnabled, string FlexibleFieldLabel, decimal FlexibleFieldPrice,
    bool QrOnReceipt,
    List<SiblingPriceDto> SiblingPrices
);

public record CreateUserDto(string Username, string DisplayName, string Password, string Role);
public record UserDto(int Id, string Username, string DisplayName, string Role, bool IsActive);

public record TreasurySummaryDto(
    decimal TotalRevenue,
    decimal CashTotal,
    decimal InstaPayTotal,
    decimal OtherTotal,
    decimal VisitsTotal,
    decimal MembershipsTotal,
    decimal PartiesTotal,
    decimal OverageTotal,
    decimal CompanionsTotal,
    decimal OpeningBalance,
    decimal ExpectedCash
);

public record DayReportDto(
    string CenterName,
    string? CenterPhone,
    DateTime BusinessDate,
    string CashierName,
    DateTime OpenedAt,
    DateTime ClosedAt,
    TreasurySummaryDto Summary,
    List<ReportLineDto> IndividualPackages,
    List<ReportLineDto> SiblingPackages,
    decimal CompanionsTotal,
    decimal OverageTotal,
    List<ReportLineDto> Parties,
    List<ReportLineDto> Memberships,
    int MembershipHoursUsed,
    decimal OpeningBalance,
    decimal ExpectedCash,
    decimal ActualCash,
    decimal Difference,
    string? EmergencyNotes
);
public record ReportLineDto(string Label, int Count, decimal Amount);
