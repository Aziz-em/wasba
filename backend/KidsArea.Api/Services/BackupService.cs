using System.IO.Compression;

namespace KidsArea.Api.Services;

public class BackupService
{
    private readonly IWebHostEnvironment _environment;
    private readonly SemaphoreSlim _lock = new(1, 1);
    public BackupService(IWebHostEnvironment environment) => _environment = environment;

    public async Task<string> CreateAsync()
    {
        await _lock.WaitAsync();
        try
        {
            var root = _environment.ContentRootPath;
            var dir = Path.Combine(root, "backups");
            Directory.CreateDirectory(dir);
            var stamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss");
            var work = Path.Combine(dir, $"kidsarea-{stamp}");
            Directory.CreateDirectory(work);
            foreach (var file in Directory.GetFiles(root, "kidsarea.db*")) File.Copy(file, Path.Combine(work, Path.GetFileName(file)), true);
            var zip = Path.Combine(dir, $"kidsarea-backup-{stamp}.zip");
            ZipFile.CreateFromDirectory(work, zip, CompressionLevel.Optimal, false);
            Directory.Delete(work, true);
            foreach (var old in Directory.GetFiles(dir, "*.zip").OrderByDescending(File.GetCreationTimeUtc).Skip(30)) File.Delete(old);
            return zip;
        }
        finally { _lock.Release(); }
    }
}

public class AutomaticBackupService : BackgroundService
{
    private readonly BackupService _backup;
    public AutomaticBackupService(BackupService backup) => _backup = backup;
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await _backup.CreateAsync();
        using var timer = new PeriodicTimer(TimeSpan.FromHours(24));
        while (await timer.WaitForNextTickAsync(stoppingToken)) await _backup.CreateAsync();
    }
}