namespace KidsArea.Domain.Entities;

/// <summary>Singleton-style settings row (Id=1).</summary>
public class SystemSettings : BaseEntity
{
    public string CenterName { get; set; } = "Kids Area";
    public string? CenterPhone { get; set; }
    public string ClosingTime { get; set; } = "23:00"; // HH:mm
    public string? LogoPath { get; set; }
    public string? LoginBackgroundPath { get; set; }
    public string? HomeBackgroundPath { get; set; }
    public string IconTheme { get; set; } = "classic"; // classic | colorful | simple
    public string Currency { get; set; } = "ج.م";
    public int GraceMinutes { get; set; } = 15;

    // Individual packages
    public decimal Price1Hour { get; set; }
    public decimal Price2Hours { get; set; }
    public decimal Price3Hours { get; set; }
        public decimal Price4Hours { get; set; }
    public decimal PriceFullDay { get; set; }

    // Extra companion (3rd+)
    public decimal ExtraCompanionPrice { get; set; }

    // Flexible field
    public bool FlexibleFieldEnabled { get; set; }
    public string FlexibleFieldLabel { get; set; } = "إضافة";
    public decimal FlexibleFieldPrice { get; set; }

    public bool QrOnReceipt { get; set; } = true;
}

/// <summary>Sibling pricing matrix: SiblingsCount + DurationPackage → Price</summary>
public class SiblingPrice : BaseEntity
{
    public int SiblingsCount { get; set; } // 2,3,4,...
    public int DurationPackage { get; set; } // maps DurationPackage enum
    public decimal Price { get; set; }
}

public class PaymentMethodDef : BaseEntity
{
    public string Name { get; set; } = "";
    public string Code { get; set; } = ""; // cash | instapay | custom
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
