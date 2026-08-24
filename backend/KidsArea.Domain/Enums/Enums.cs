namespace KidsArea.Domain.Enums;

public enum UserRole { Cashier = 1, Owner = 2 }

public enum VisitStatus { Active = 1, CheckedOut = 2, Cancelled = 3 }

public enum PricingMode { Individual = 1, Siblings = 2 }

public enum DurationPackage { OneHour = 1, TwoHours = 2, ThreeHours = 3, FullDay = 4, FourHours = 5 }

public enum MembershipKind { UnlimitedMonthly = 1, HoursBalance = 2 }

public enum PaymentMethodType { Cash = 1, InstaPay = 2, Other = 3 }

public enum ShiftStatus { Open = 1, Closed = 2 }
