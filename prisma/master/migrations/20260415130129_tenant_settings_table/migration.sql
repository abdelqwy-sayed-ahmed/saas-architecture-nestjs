-- DropForeignKey
ALTER TABLE `tenantconfig` DROP FOREIGN KEY `TenantConfig_tenantId_fkey`;

-- CreateTable
CREATE TABLE `setting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `tenant_id` INTEGER NOT NULL,

    UNIQUE INDEX `setting_tenant_id_key_key`(`tenant_id`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tenantconfig` ADD CONSTRAINT `tenantconfig_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `setting` ADD CONSTRAINT `setting_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `tenant` RENAME INDEX `Tenant_code_key` TO `tenant_code_key`;

-- RenameIndex
ALTER TABLE `tenantconfig` RENAME INDEX `TenantConfig_tenantId_key` TO `tenantconfig_tenantId_key`;
